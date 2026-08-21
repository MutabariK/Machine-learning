import io
import numpy as np
import pandas as pd
from django.http import HttpResponse
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import IsOfficial
from .models import EvaluationResponse
from .serializers import EvaluationResponseSerializer, EvaluationSubmitSerializer


def cronbach_alpha(item_matrix):
    """Cronbach's alpha for a construct's items.

    item_matrix: 2D array-like, one row per respondent, one column per item.
    Returns None when there's too little data to compute a meaningful value
    (fewer than 2 respondents, or zero variance in total scores).
    """
    item_matrix = np.array(item_matrix, dtype=float)
    n_items = item_matrix.shape[1]
    n_respondents = item_matrix.shape[0]
    if n_items < 2 or n_respondents < 2:
        return None
    item_variances = item_matrix.var(axis=0, ddof=1)
    total_scores = item_matrix.sum(axis=1)
    total_variance = total_scores.var(ddof=1)
    if total_variance == 0:
        return None
    alpha = (n_items / (n_items - 1)) * (1 - (item_variances.sum() / total_variance))
    return round(float(alpha), 3)


class EvaluationCreateView(generics.CreateAPIView):
    serializer_class = EvaluationSubmitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if EvaluationResponse.objects.filter(user=request.user).exists():
            return Response(
                {'detail': 'You have already submitted an evaluation.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class EvaluationCheckView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        has_submitted = EvaluationResponse.objects.filter(user=request.user).exists()
        return Response({'has_submitted': has_submitted})


class EvaluationListView(generics.ListAPIView):
    queryset = EvaluationResponse.objects.select_related('user').all()
    serializer_class = EvaluationResponseSerializer
    permission_classes = [IsOfficial]


PU_LABELS = [
    "Improves ability to carry out tasks", "Easier to track resolution",
    "Enhances engagement with government", "Useful for monitoring delivery",
    "Increases productivity", "Overall useful",
]
PEOU_LABELS = [
    "Easy to learn", "Easy to get system to do what I want",
    "Clear and understandable", "Flexible to interact with",
    "Easy to become skillful", "Overall easy to use",
]
BI_LABELS = [
    "Intend to continue using", "Would recommend to others",
    "Plan to use frequently",
]


def _build_segment_stats(responses):
    """Compute the TAM/demographic breakdown for one set of EvaluationResponse
    rows. Used to build the overall, citizen-only, and official/admin-only
    segments from the same underlying items — the questions never change,
    only which respondents are included.
    """
    all_responses = list(responses)
    n = len(all_responses)
    if n == 0:
        return {'total_responses': 0, 'tam': {}, 'demographics': {}}

    pu_scores = [r.tam_perceived_usefulness for r in all_responses]
    peou_scores = [r.tam_perceived_ease_of_use for r in all_responses]
    bi_scores = [r.tam_behavioral_intention for r in all_responses]

    pu_matrix = [[getattr(r, f'pu_{i}') for i in range(1, 7)] for r in all_responses]
    peou_matrix = [[getattr(r, f'peou_{i}') for i in range(1, 7)] for r in all_responses]
    bi_matrix = [[getattr(r, f'bi_{i}') for i in range(1, 4)] for r in all_responses]

    def compute_item_avgs(prefix, labels, count):
        result = {}
        for i in range(1, count + 1):
            vals = [getattr(r, f'{prefix}_{i}') for r in all_responses]
            result[labels[i - 1]] = round(float(np.mean(vals)), 2)
        return result

    def count_field(field):
        counts = {}
        for r in all_responses:
            val = getattr(r, field)
            display = val
            for choice_val, choice_label in getattr(EvaluationResponse, field).field.choices:
                if choice_val == val:
                    display = choice_label
                    break
            counts[display] = counts.get(display, 0) + 1
        return counts

    reported_counts = {
        'Yes': sum(1 for r in all_responses if r.reported_issue_before),
        'No': sum(1 for r in all_responses if not r.reported_issue_before),
    }

    return {
        'total_responses': n,
        'tam': {
            'perceived_usefulness': {
                'mean': round(float(np.mean(pu_scores)), 2),
                'std_dev': round(float(np.std(pu_scores)), 2),
                'cronbach_alpha': cronbach_alpha(pu_matrix),
                'item_averages': compute_item_avgs('pu', PU_LABELS, 6),
            },
            'perceived_ease_of_use': {
                'mean': round(float(np.mean(peou_scores)), 2),
                'std_dev': round(float(np.std(peou_scores)), 2),
                'cronbach_alpha': cronbach_alpha(peou_matrix),
                'item_averages': compute_item_avgs('peou', PEOU_LABELS, 6),
            },
            'behavioral_intention': {
                'mean': round(float(np.mean(bi_scores)), 2),
                'std_dev': round(float(np.std(bi_scores)), 2),
                'cronbach_alpha': cronbach_alpha(bi_matrix),
                'item_averages': compute_item_avgs('bi', BI_LABELS, 3),
            },
        },
        'demographics': {
            'age_range': count_field('age_range'),
            'gender': count_field('gender'),
            'education': count_field('education'),
            'digital_service_frequency': count_field('digital_service_frequency'),
            'reported_issue_before': reported_counts,
        },
    }


class EvaluationAnalyticsView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        base = EvaluationResponse.objects.select_related('user').all()
        return Response({
            'overall': _build_segment_stats(base),
            'citizen': _build_segment_stats(base.filter(user__role='citizen')),
            'official_admin': _build_segment_stats(base.filter(user__role__in=['official', 'admin'])),
        })


class EvaluationExportView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        responses = EvaluationResponse.objects.select_related('user').all()

        likert_fields = (
            [f'pu_{i}' for i in range(1, 7)]
            + [f'peou_{i}' for i in range(1, 7)]
            + [f'bi_{i}' for i in range(1, 4)]
        )

        rows = []
        for r in responses:
            row = {
                'Response ID': r.id,
                'Participant': getattr(r.user, 'full_name', '') or r.user.get_username(),
                'Age Range': r.get_age_range_display(),
                'Gender': r.get_gender_display(),
                'Education': r.get_education_display(),
                'Digital Service Frequency': r.get_digital_service_frequency_display(),
                'Reported Issue Before': 'Yes' if r.reported_issue_before else 'No',
                'County of Residence': r.county_of_residence,
            }
            for field in likert_fields:
                row[field.upper()] = getattr(r, field)
            row['TAM Perceived Usefulness'] = r.tam_perceived_usefulness
            row['TAM Perceived Ease of Use'] = r.tam_perceived_ease_of_use
            row['TAM Behavioral Intention'] = r.tam_behavioral_intention
            row['Submitted At'] = r.created_at.strftime('%Y-%m-%d %H:%M:%S')
            rows.append(row)

        df = pd.DataFrame(rows)

        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Evaluation Responses', index=False)
            if rows:
                summary = pd.DataFrame([
                    {'Metric': 'Total Responses', 'Value': len(rows)},
                    {'Metric': 'Average Perceived Usefulness', 'Value': round(float(np.mean([r.tam_perceived_usefulness for r in responses])), 2)},
                    {'Metric': 'Average Perceived Ease of Use', 'Value': round(float(np.mean([r.tam_perceived_ease_of_use for r in responses])), 2)},
                    {'Metric': 'Average Behavioral Intention', 'Value': round(float(np.mean([r.tam_behavioral_intention for r in responses])), 2)},
                ])
                summary.to_excel(writer, sheet_name='Summary', index=False)

            for sheet in writer.sheets.values():
                for column_cells in sheet.columns:
                    length = max(len(str(cell.value)) if cell.value is not None else 0 for cell in column_cells)
                    sheet.column_dimensions[column_cells[0].column_letter].width = min(max(length + 2, 10), 40)

        buffer.seek(0)
        response = HttpResponse(
            buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="evaluation_data.xlsx"'
        return response
