from django.urls import path
from . import views

urlpatterns = [
    path('summary/', views.SummaryStatsView.as_view(), name='analytics_summary'),
    path('by-category/', views.ComplaintsByCategoryView.as_view(), name='analytics_by_category'),
    path('by-ward/', views.ComplaintsByWardView.as_view(), name='analytics_by_ward'),
    path('by-status/', views.ComplaintsByStatusView.as_view(), name='analytics_by_status'),
    path('trends/', views.ComplaintTrendsView.as_view(), name='analytics_trends'),
    path('service-performance/', views.ServicePerformanceView.as_view(), name='service_performance'),
    path('by-official/', views.OfficialPerformanceView.as_view(), name='analytics_by_official'),
    path('export/csv/', views.CSVExportView.as_view(), name='export_csv'),
]
