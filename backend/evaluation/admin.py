from django.contrib import admin
from .models import EvaluationResponse


@admin.register(EvaluationResponse)
class EvaluationResponseAdmin(admin.ModelAdmin):
    list_display = ('user', 'sus_score', 'tam_perceived_usefulness', 'tam_perceived_ease_of_use', 'created_at')
    list_filter = ('age_range', 'gender', 'education')
