from rest_framework import serializers
from .models import EvaluationResponse


class EvaluationSubmitSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationResponse
        exclude = ['id', 'user', 'created_at']


class EvaluationResponseSerializer(serializers.ModelSerializer):
    tam_perceived_usefulness = serializers.FloatField(read_only=True)
    tam_perceived_ease_of_use = serializers.FloatField(read_only=True)
    tam_behavioral_intention = serializers.FloatField(read_only=True)

    class Meta:
        model = EvaluationResponse
        fields = [
            'id', 'age_range', 'gender', 'education',
            'digital_service_frequency', 'reported_issue_before',
            'pu_1', 'pu_2', 'pu_3', 'pu_4', 'pu_5', 'pu_6',
            'peou_1', 'peou_2', 'peou_3', 'peou_4', 'peou_5', 'peou_6',
            'bi_1', 'bi_2', 'bi_3',
            'tam_perceived_usefulness',
            'tam_perceived_ease_of_use', 'tam_behavioral_intention',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
