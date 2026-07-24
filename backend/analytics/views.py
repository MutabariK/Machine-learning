import csv
import io
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.http import HttpResponse
from django.utils.dateparse import parse_datetime
from users.permissions import IsOfficial
from .services import AnalyticsService


def parse_date_params(request):
    date_from = request.query_params.get('date_from')
    date_to = request.query_params.get('date_to')
    if date_from:
        date_from = parse_datetime(date_from + 'T00:00:00+03:00') if 'T' not in date_from else parse_datetime(date_from)
    if date_to:
        date_to = parse_datetime(date_to + 'T23:59:59+03:00') if 'T' not in date_to else parse_datetime(date_to)
    return date_from, date_to


class SummaryStatsView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        date_from, date_to = parse_date_params(request)
        stats = AnalyticsService.get_summary_stats(date_from, date_to)
        return Response(stats)


class ComplaintsByCategoryView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        date_from, date_to = parse_date_params(request)
        data = AnalyticsService.get_complaints_by_category(date_from, date_to)
        return Response(data)


class ComplaintsByWardView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        date_from, date_to = parse_date_params(request)
        data = AnalyticsService.get_complaints_by_ward(date_from, date_to)
        return Response(data)


class ComplaintsByStatusView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        date_from, date_to = parse_date_params(request)
        data = AnalyticsService.get_complaints_by_status(date_from, date_to)
        return Response(data)


class ComplaintTrendsView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        period = request.query_params.get('period', 'daily')
        if period not in ('daily', 'weekly', 'monthly'):
            return Response(
                {'detail': 'period must be daily, weekly, or monthly.'},
                status=400
            )
        try:
            days = int(request.query_params.get('days', 30))
        except (ValueError, TypeError):
            return Response({'detail': 'days must be an integer.'}, status=400)
        if not (1 <= days <= 365):
            return Response({'detail': 'days must be between 1 and 365.'}, status=400)
        data = AnalyticsService.get_complaint_trends(period, days)
        return Response(data)


class ServicePerformanceView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        date_from, date_to = parse_date_params(request)
        data = AnalyticsService.get_service_performance(date_from, date_to)
        return Response(data)


class OfficialPerformanceView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        date_from, date_to = parse_date_params(request)
        data = AnalyticsService.get_official_performance(date_from, date_to)
        return Response(data)


class CSVExportView(APIView):
    permission_classes = [IsOfficial]

    def get(self, request):
        date_from, date_to = parse_date_params(request)
        buffer = io.StringIO()
        writer = csv.writer(buffer)

        df = AnalyticsService.get_complaint_dataframe(date_from, date_to)
        if not df.empty:
            writer.writerow(['ID', 'Category', 'Ward', 'Title', 'Location', 'Status', 'Created At', 'Updated At'])
            for _, row in df.iterrows():
                writer.writerow([
                    row['id'], row['category'], row.get('ward', ''),
                    row['title'], row['location'], row['status'],
                    row['created_at'], row['updated_at'],
                ])

        writer.writerow([])
        writer.writerow(['SUMMARY'])
        summary = AnalyticsService.get_summary_stats(date_from, date_to)
        for key, value in summary.items():
            writer.writerow([key.replace('_', ' ').title(), value])

        response = HttpResponse(buffer.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="service_delivery_report.csv"'
        return response
