from django.urls import path
from . import views

urlpatterns = [
    path('', views.ComplaintListCreateView.as_view(), name='complaint_list_create'),
    path('<int:pk>/', views.ComplaintDetailView.as_view(), name='complaint_detail'),
    path('<int:pk>/update/', views.ComplaintUpdateView.as_view(), name='complaint_update'),
    path('categories/', views.CategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category_detail'),
    path('wards/', views.WardListCreateView.as_view(), name='ward_list_create'),
    path('wards/<int:pk>/', views.WardDetailView.as_view(), name='ward_detail'),
    path('feedback/', views.FeedbackCreateView.as_view(), name='feedback_create'),
]
