from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    complaint_title = serializers.CharField(source='complaint.title', read_only=True, default='')

    class Meta:
        model = Notification
        fields = ['id', 'complaint', 'complaint_title', 'message', 'is_read', 'created_at']
        read_only_fields = fields
