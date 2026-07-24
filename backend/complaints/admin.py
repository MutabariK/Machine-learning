from django.contrib import admin
from .models import Category, Ward, Complaint, ComplaintStatusHistory, Feedback


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)


@admin.register(Ward)
class WardAdmin(admin.ModelAdmin):
    list_display = ('name', 'sub_county', 'is_active')
    list_filter = ('sub_county', 'is_active')
    search_fields = ('name', 'sub_county')


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'citizen', 'category', 'ward', 'status', 'created_at')
    list_filter = ('status', 'category', 'ward')
    search_fields = ('title', 'description', 'location')
    raw_id_fields = ('citizen', 'assigned_to')


@admin.register(ComplaintStatusHistory)
class ComplaintStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('complaint', 'old_status', 'new_status', 'changed_by', 'changed_at')
    list_filter = ('new_status',)


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('complaint', 'citizen', 'rating', 'created_at')
    list_filter = ('rating',)
