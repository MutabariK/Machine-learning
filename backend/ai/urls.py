from django.urls import path
from . import views

urlpatterns = [
    path('suggest-category/', views.CategorySuggestionView.as_view(), name='ai_suggest_category'),
    path('analyze-priority/', views.PriorityAnalysisView.as_view(), name='ai_analyze_priority'),
    path('draft-response/', views.DraftResponseView.as_view(), name='ai_draft_response'),
    path('chat/', views.ChatView.as_view(), name='ai_chat'),
]
