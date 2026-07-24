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


class EvaluationAnalyticsView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        responses = EvaluationResponse.objects.all()
        if not responses.exists():
            return Response({
                'total_responses': 0,
                'sus': {}, 'tam': {}, 'demographics': {},
            })

        all_responses = list(responses)
        n = len(all_responses)

        # --- SUS Analysis ---
        sus_scores = [r.sus_score for r in all_responses]
        avg_sus = round(float(np.mean(sus_scores)), 2)
        median_sus = round(float(np.median(sus_scores)), 2)

        if avg_sus >= 80.3:
            grade = 'A'
        elif avg_sus >= 68:
            grade = 'B'
        elif avg_sus >= 51:
            grade = 'C'
        else:
            grade = 'D'

        acceptability = 'Acceptable' if avg_sus >= 70 else ('Marginal' if avg_sus >= 50 else 'Not Acceptable')

        sus_questions = [
            "Would use frequently", "Unnecessarily complex", "Easy to use",
            "Need technical support", "Well integrated", "Too much inconsistency",
            "Easy to learn", "Cumbersome to use", "Felt confident", "Needed to learn a lot",
        ]
        sus_q_avgs = {}
        for i in range(1, 11):
            vals = [getattr(r, f'sus_{i}') for r in all_responses]
            sus_q_avgs[sus_questions[i - 1]] = round(float(np.mean(vals)), 2)

        score_distribution = []
        for label, low, high in [('0-20', 0, 20), ('21-40', 21, 40), ('41-60', 41, 60), ('61-80', 61, 80), ('81-100', 81, 100)]:
            score_distribution.append({'range': label, 'count': sum(1 for s in sus_scores if low <= s <= high)})

        # --- TAM Analysis ---
        pu_scores = [r.tam_perceived_usefulness for r in all_responses]
        peou_scores = [r.tam_perceived_ease_of_use for r in all_responses]
        bi_scores = [r.tam_behavioral_intention for r in all_responses]

        pu_labels = [
            "Improves ability to report issues", "Easier to track resolution",
            "Enhances engagement with government", "Useful for monitoring delivery",
            "Increases productivity", "Overall useful",
        ]
        peou_labels = [
            "Easy to learn", "Easy to get system to do what I want",
            "Clear and understandable", "Flexible to interact with",
            "Easy to become skillful", "Overall easy to use",
        ]
        bi_labels = [
            "Intend to use for reporting", "Would recommend to others",
            "Plan to use frequently",
        ]

        def compute_item_avgs(prefix, labels, count):
            result = {}
            for i in range(1, count + 1):
                vals = [getattr(r, f'{prefix}_{i}') for r in all_responses]
                result[labels[i - 1]] = round(float(np.mean(vals)), 2)
            return result

        # --- Demographics ---
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

        return Response({
            'total_responses': n,
            'sus': {
                'average_score': avg_sus,
                'median_score': median_sus,
                'min_score': round(float(min(sus_scores)), 2),
                'max_score': round(float(max(sus_scores)), 2),
                'std_dev': round(float(np.std(sus_scores)), 2),
                'grade': grade,
                'acceptability': acceptability,
                'question_averages': sus_q_avgs,
                'score_distribution': score_distribution,
            },
            'tam': {
                'perceived_usefulness': {
                    'mean': round(float(np.mean(pu_scores)), 2),
                    'std_dev': round(float(np.std(pu_scores)), 2),
                    'item_averages': compute_item_avgs('pu', pu_labels, 6),
                },
                'perceived_ease_of_use': {
                    'mean': round(float(np.mean(peou_scores)), 2),
                    'std_dev': round(float(np.std(peou_scores)), 2),
                    'item_averages': compute_item_avgs('peou', peou_labels, 6),
                },
                'behavioral_intention': {
                    'mean': round(float(np.mean(bi_scores)), 2),
                    'std_dev': round(float(np.std(bi_scores)), 2),
                    'item_averages': compute_item_avgs('bi', bi_labels, 3),
                },
            },
            'demographics': {
                'age_range': count_field('age_range'),
                'gender': count_field('gender'),
                'education': count_field('education'),
                'digital_service_frequency': count_field('digital_service_frequency'),
                'reported_issue_before': reported_counts,
            },
        })


class EvaluationExportView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        responses = EvaluationResponse.objects.select_related('user').all()

        likert_fields = (
            [f'sus_{i}' for i in range(1, 11)]
            + [f'pu_{i}' for i in range(1, 7)]
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
            row['SUS Score'] = r.sus_score
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
                    {'Metric': 'Average SUS Score', 'Value': round(float(np.mean([r.sus_score for r in responses])), 2)},
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
