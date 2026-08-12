from django.contrib import admin
from .models import EvaluationResponse


@admin.register(EvaluationResponse)
class EvaluationResponseAdmin(admin.ModelAdmin):
    list_display = ('user', 'tam_perceived_usefulness', 'tam_perceived_ease_of_use', 'tam_behavioral_intention', 'created_at')
    list_filter = ('age_range', 'gender', 'education')
