from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from complaints.models import Category

User = get_user_model()

MAX_AVATAR_SIZE = getattr(settings, 'MAX_UPLOAD_SIZE', 5 * 1024 * 1024)
ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone_number', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data['role'] = 'citizen'
        return User.objects.create_user(**validated_data)


MAX_DEPARTMENTS_PER_OFFICIAL = 2


class AdminUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    departments = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), many=True, required=False
    )

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone_number', 'password', 'role', 'departments', 'is_active']

    def validate_email(self, value):
        value = User.objects.normalize_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, data):
        role = data.get('role', 'citizen')
        departments = data.get('departments') or []
        if role == 'official':
            if not departments:
                raise serializers.ValidationError({'departments': 'Officials must be assigned to at least one department.'})
            if len(departments) > MAX_DEPARTMENTS_PER_OFFICIAL:
                raise serializers.ValidationError({'departments': f'Officials may be assigned to at most {MAX_DEPARTMENTS_PER_OFFICIAL} departments.'})
        else:
            data['departments'] = []
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)


class UserSerializer(serializers.ModelSerializer):
    departments = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), many=True, required=False
    )
    department_names = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone_number', 'avatar', 'role', 'departments', 'department_names', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_department_names(self, obj):
        return ', '.join(obj.departments.values_list('name', flat=True))

    def validate(self, data):
        role = data.get('role', self.instance.role if self.instance else 'citizen')
        departments = data.get('departments')
        has_existing_departments = self.instance and self.instance.departments.exists()
        if role == 'official':
            if departments is not None:
                if not departments:
                    raise serializers.ValidationError({'departments': 'Officials must be assigned to at least one department.'})
                if len(departments) > MAX_DEPARTMENTS_PER_OFFICIAL:
                    raise serializers.ValidationError({'departments': f'Officials may be assigned to at most {MAX_DEPARTMENTS_PER_OFFICIAL} departments.'})
            elif not has_existing_departments:
                raise serializers.ValidationError({'departments': 'Officials must be assigned to at least one department.'})
        elif role == 'citizen':
            data['departments'] = []
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone_number', 'avatar', 'role', 'created_at']
        read_only_fields = ['id', 'email', 'role', 'created_at']

    def validate_avatar(self, value):
        if value:
            if value.size > MAX_AVATAR_SIZE:
                raise serializers.ValidationError('Image must be less than 5MB.')
            if value.content_type not in ALLOWED_IMAGE_TYPES:
                raise serializers.ValidationError('Only JPEG, PNG, GIF, and WebP images are allowed.')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class EmailChangeSerializer(serializers.Serializer):
    new_email = serializers.EmailField(required=True)
    current_password = serializers.CharField(required=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_email(self, value):
        value = User.objects.normalize_email(value)
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(email__iexact=value).exists():
            raise serializers.ValidationError('This email is already in use.')
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate(self, data):
        try:
            uid = force_str(urlsafe_base64_decode(data['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({'uid': 'This reset link is invalid.'})
        if not default_token_generator.check_token(user, data['token']):
            raise serializers.ValidationError({'token': 'This reset link is invalid or has expired.'})
        data['user'] = user
        return data
