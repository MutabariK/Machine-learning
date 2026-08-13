from django.conf import settings
from django.db import transaction
from rest_framework import serializers
from .models import Category, Ward, Complaint, ComplaintStatusHistory, Feedback


class CategorySerializer(serializers.ModelSerializer):
    complaint_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'complaint_count']
        read_only_fields = ['id', 'created_at']


class WardSerializer(serializers.ModelSerializer):
    complaint_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Ward
        fields = ['id', 'name', 'sub_county', 'is_active', 'created_at', 'complaint_count']
        read_only_fields = ['id', 'created_at']


class ComplaintStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True, default='')

    class Meta:
        model = ComplaintStatusHistory
        fields = ['id', 'old_status', 'new_status', 'changed_by', 'changed_by_name', 'notes', 'changed_at']
        read_only_fields = ['id', 'changed_at']


class FeedbackSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.full_name', read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'complaint', 'citizen', 'citizen_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'citizen', 'created_at']


class ComplaintListSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    ward_name = serializers.CharField(source='ward.name', read_only=True, default='')
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, default='')

    class Meta:
        model = Complaint
        fields = [
            'id', 'citizen', 'citizen_name', 'category', 'category_name',
            'ward', 'ward_name', 'title', 'location', 'latitude', 'longitude',
            'status', 'assigned_to', 'assigned_to_name', 'created_at', 'updated_at'
        ]


class ComplaintDetailSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    ward_name = serializers.CharField(source='ward.name', read_only=True, default='')
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True, default='')
    status_history = ComplaintStatusHistorySerializer(many=True, read_only=True)
    feedback = FeedbackSerializer(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            'id', 'citizen', 'citizen_name', 'category', 'category_name',
            'ward', 'ward_name', 'title', 'description', 'location',
            'latitude', 'longitude', 'image', 'status', 'assigned_to',
            'assigned_to_name', 'resolution_notes', 'created_at', 'updated_at',
            'status_history', 'feedback'
        ]
        read_only_fields = ['id', 'citizen', 'status', 'created_at', 'updated_at']


class ComplaintCreateSerializer(serializers.ModelSerializer):
    title = serializers.CharField(min_length=5, max_length=255)
    description = serializers.CharField(min_length=10, max_length=5000)
    location = serializers.CharField(min_length=2, max_length=255)

    class Meta:
        model = Complaint
        fields = [
            'id', 'category', 'ward', 'title', 'description',
            'location', 'latitude', 'longitude', 'image'
        ]

    def validate_image(self, value):
        if value:
            max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 5 * 1024 * 1024)
            if value.size > max_size:
                raise serializers.ValidationError('Image must be less than 5MB.')
            allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if value.content_type not in allowed:
                raise serializers.ValidationError('Only JPEG, PNG, GIF, and WebP images are allowed.')
        return value

    def validate_latitude(self, value):
        if value is not None and not (-90 <= value <= 90):
            raise serializers.ValidationError('Latitude must be between -90 and 90.')
        return value

    def validate_longitude(self, value):
        if value is not None and not (-180 <= value <= 180):
            raise serializers.ValidationError('Longitude must be between -180 and 180.')
        return value

    def create(self, validated_data):
        with transaction.atomic():
            validated_data['citizen'] = self.context['request'].user
            complaint = super().create(validated_data)
            ComplaintStatusHistory.objects.create(
                complaint=complaint,
                new_status='submitted',
                changed_by=self.context['request'].user,
                notes='Complaint submitted'
            )
        return complaint


class ComplaintUpdateSerializer(serializers.ModelSerializer):
    ALLOWED_TRANSITIONS = {
        'submitted': ['under_review', 'closed'],
        'under_review': ['in_progress', 'closed'],
        'in_progress': ['resolved', 'closed'],
        'resolved': ['closed'],
        'closed': [],
    }
    STATUS_LABELS = {
        'submitted': 'Submitted', 'under_review': 'Under Review',
        'in_progress': 'In Progress', 'resolved': 'Resolved', 'closed': 'Closed',
    }

    class Meta:
        model = Complaint
        fields = ['status', 'assigned_to', 'resolution_notes']

    def validate_status(self, value):
        if self.instance:
            allowed = self.ALLOWED_TRANSITIONS.get(self.instance.status, [])
            if value != self.instance.status and value not in allowed:
                labels = self.STATUS_LABELS
                raise serializers.ValidationError(
                    f'Cannot change status from "{labels.get(self.instance.status, self.instance.status)}" '
                    f'to "{labels.get(value, value)}".'
                )
        return value

    def validate_assigned_to(self, value):
        if value is None:
            return value
        if value.role != 'official':
            raise serializers.ValidationError(
                'Complaints can only be assigned to county officials.'
            )
        category = self.instance.category if self.instance else None
        if category is not None and value.department_id != category.id:
            raise serializers.ValidationError(
                f'{value.full_name} is not in the department responsible for this complaint\'s category.'
            )
        return value

    def update(self, instance, validated_data):
        from notifications.services import notify_status_change, notify_assignment

        with transaction.atomic():
            old_status = instance.status
            old_assigned_to_id = instance.assigned_to_id
            complaint = super().update(instance, validated_data)
            new_status = validated_data.get('status', old_status)
            if new_status != old_status:
                ComplaintStatusHistory.objects.create(
                    complaint=complaint,
                    old_status=old_status,
                    new_status=new_status,
                    changed_by=self.context['request'].user,
                    notes=validated_data.get('resolution_notes', '')
                )
                notify_status_change(complaint, old_status, new_status)
            if 'assigned_to' in validated_data and complaint.assigned_to_id != old_assigned_to_id:
                notify_assignment(complaint)
        return complaint
