from django.db import models
from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Category, Ward, Complaint, Feedback
from .serializers import (
    CategorySerializer, WardSerializer,
    ComplaintListSerializer, ComplaintDetailSerializer,
    ComplaintCreateSerializer, ComplaintUpdateSerializer,
    FeedbackSerializer
)
from users.permissions import IsAdmin, IsOfficial


class CategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        return Category.objects.annotate(complaint_count=Count('complaints'))


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]


class WardListCreateView(generics.ListCreateAPIView):
    serializer_class = WardSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def get_queryset(self):
        return Ward.objects.annotate(complaint_count=Count('complaints'))


class WardDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Ward.objects.all()
    serializer_class = WardSerializer
    permission_classes = [IsAdmin]


class ComplaintListCreateView(generics.ListCreateAPIView):
    filterset_fields = ['status', 'category', 'ward']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['created_at', 'updated_at', 'status']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ComplaintCreateSerializer
        return ComplaintListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Complaint.objects.select_related('citizen', 'category', 'ward', 'assigned_to')
        if user.role == 'citizen':
            qs = qs.filter(citizen=user)
        return qs

    def create(self, request, *args, **kwargs):
        if request.user.role != 'citizen':
            return Response(
                {'detail': 'Only citizens can submit complaints.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)


class ComplaintDetailView(generics.RetrieveAPIView):
    serializer_class = ComplaintDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Complaint.objects.select_related('citizen', 'category', 'ward', 'assigned_to')
        qs = qs.prefetch_related('status_history', 'feedback')
        if user.role == 'citizen':
            qs = qs.filter(citizen=user)
        return qs


class ComplaintUpdateView(generics.UpdateAPIView):
    serializer_class = ComplaintUpdateSerializer
    permission_classes = [IsOfficial]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Complaint.objects.all()
        return Complaint.objects.filter(
            models.Q(assigned_to=user) | models.Q(assigned_to__isnull=True)
        )


class FeedbackCreateView(generics.CreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        complaint_id = request.data.get('complaint')
        try:
            complaint = Complaint.objects.get(id=complaint_id)
        except Complaint.DoesNotExist:
            return Response({'detail': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        if complaint.citizen != request.user:
            return Response(
                {'detail': 'You can only provide feedback on your own complaints.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if complaint.status not in ('resolved', 'closed'):
            return Response(
                {'detail': 'Feedback can only be submitted for resolved or closed complaints.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if hasattr(complaint, 'feedback') and complaint.feedback:
            return Response(
                {'detail': 'Feedback has already been submitted for this complaint.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user)
