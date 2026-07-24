from django.urls import path
from . import views

urlpatterns = [
    path('submit/', views.EvaluationCreateView.as_view(), name='evaluation_submit'),
    path('check/', views.EvaluationCheckView.as_view(), name='evaluation_check'),
    path('list/', views.EvaluationListView.as_view(), name='evaluation_list'),
    path('analytics/', views.EvaluationAnalyticsView.as_view(), name='evaluation_analytics'),
    path('export/', views.EvaluationExportView.as_view(), name='evaluation_export'),
]
