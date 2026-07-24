import pandas as pd
import numpy as np
from django.utils import timezone
from datetime import timedelta
from complaints.models import Complaint, Feedback
from django.contrib.auth import get_user_model

User = get_user_model()


class AnalyticsService:

    @staticmethod
    def get_complaint_dataframe(date_from=None, date_to=None):
        qs = Complaint.objects.select_related('category', 'ward', 'citizen', 'assigned_to').all()
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)

        data = list(qs.values(
            'id', 'citizen_id', 'category__name', 'ward__name',
            'title', 'location', 'latitude', 'longitude',
            'status', 'created_at', 'updated_at'
        ))
        if not data:
            return pd.DataFrame()
        df = pd.DataFrame(data)
        df.rename(columns={
            'category__name': 'category',
            'ward__name': 'ward',
        }, inplace=True)
        return df

    @staticmethod
    def get_summary_stats(date_from=None, date_to=None):
        df = AnalyticsService.get_complaint_dataframe(date_from, date_to)
        if df.empty:
            return {
                'total_complaints': 0,
                'open_complaints': 0,
                'resolved_complaints': 0,
                'closed_complaints': 0,
                'resolution_rate': 0.0,
                'avg_response_time_hours': 0.0,
                'avg_resolution_time_hours': 0.0,
            }

        total = len(df)
        open_statuses = ['submitted', 'under_review', 'in_progress']
        open_count = int(df[df['status'].isin(open_statuses)].shape[0])
        resolved_count = int(df[df['status'] == 'resolved'].shape[0])
        closed_count = int(df[df['status'] == 'closed'].shape[0])
        resolution_rate = round(((resolved_count + closed_count) / total) * 100, 2) if total > 0 else 0.0

        resolved_df = df[df['status'].isin(['resolved', 'closed'])].copy()
        if not resolved_df.empty:
            resolved_df['created_at'] = pd.to_datetime(resolved_df['created_at'])
            resolved_df['updated_at'] = pd.to_datetime(resolved_df['updated_at'])
            resolved_df['resolution_hours'] = (
                resolved_df['updated_at'] - resolved_df['created_at']
            ).dt.total_seconds() / 3600
            avg_resolution = round(float(resolved_df['resolution_hours'].mean()), 2)
        else:
            avg_resolution = 0.0

        review_df = df[df['status'] != 'submitted'].copy()
        if not review_df.empty:
            from complaints.models import ComplaintStatusHistory
            first_updates = ComplaintStatusHistory.objects.filter(
                complaint_id__in=review_df['id'].tolist(),
                old_status='submitted'
            ).values('complaint_id', 'changed_at')
            if first_updates:
                updates_df = pd.DataFrame(list(first_updates))
                merged = review_df.merge(
                    updates_df, left_on='id', right_on='complaint_id', how='inner'
                )
                if not merged.empty:
                    merged['created_at'] = pd.to_datetime(merged['created_at'])
                    merged['changed_at'] = pd.to_datetime(merged['changed_at'])
                    merged['response_hours'] = (
                        merged['changed_at'] - merged['created_at']
                    ).dt.total_seconds() / 3600
                    avg_response = round(float(merged['response_hours'].mean()), 2)
                else:
                    avg_response = 0.0
            else:
                avg_response = 0.0
        else:
            avg_response = 0.0

        return {
            'total_complaints': total,
            'open_complaints': open_count,
            'resolved_complaints': resolved_count,
            'closed_complaints': closed_count,
            'resolution_rate': resolution_rate,
            'avg_response_time_hours': avg_response,
            'avg_resolution_time_hours': avg_resolution,
        }

    @staticmethod
    def get_complaints_by_category(date_from=None, date_to=None):
        df = AnalyticsService.get_complaint_dataframe(date_from, date_to)
        if df.empty:
            return []
        result = df.groupby('category').agg(
            count=('id', 'count'),
            resolved=('status', lambda x: int((x.isin(['resolved', 'closed'])).sum())),
        ).reset_index()
        result['resolution_rate'] = np.where(
            result['count'] > 0,
            np.round((result['resolved'] / result['count']) * 100, 2),
            0.0
        )
        return result.to_dict('records')

    @staticmethod
    def get_complaints_by_ward(date_from=None, date_to=None):
        df = AnalyticsService.get_complaint_dataframe(date_from, date_to)
        if df.empty:
            return []
        result = df.groupby('ward').agg(
            count=('id', 'count'),
            resolved=('status', lambda x: int((x.isin(['resolved', 'closed'])).sum())),
        ).reset_index()
        result['resolution_rate'] = np.where(
            result['count'] > 0,
            np.round((result['resolved'] / result['count']) * 100, 2),
            0.0
        )
        return result.to_dict('records')

    @staticmethod
    def get_complaints_by_status(date_from=None, date_to=None):
        df = AnalyticsService.get_complaint_dataframe(date_from, date_to)
        if df.empty:
            return []
        result = df.groupby('status').size().reset_index(name='count')
        return result.to_dict('records')

    @staticmethod
    def get_complaint_trends(period='daily', days=30):
        date_from = timezone.now() - timedelta(days=days)
        df = AnalyticsService.get_complaint_dataframe(date_from=date_from)
        if df.empty:
            return []
        df['created_at'] = pd.to_datetime(df['created_at'])
        freq_map = {'daily': 'D', 'weekly': 'W', 'monthly': 'ME'}
        freq = freq_map.get(period, 'D')
        df.set_index('created_at', inplace=True)
        result = df.resample(freq).agg(count=('id', 'count')).reset_index()
        result['created_at'] = result['created_at'].dt.strftime('%Y-%m-%d')
        result.rename(columns={'created_at': 'date'}, inplace=True)
        return result.to_dict('records')

    @staticmethod
    def get_service_performance(date_from=None, date_to=None):
        categories = AnalyticsService.get_complaints_by_category(date_from, date_to)
        feedback_qs = Feedback.objects.all()
        if date_from:
            feedback_qs = feedback_qs.filter(created_at__gte=date_from)
        if date_to:
            feedback_qs = feedback_qs.filter(created_at__lte=date_to)

        feedback_data = list(feedback_qs.values(
            'complaint__category__name', 'rating'
        ))
        if feedback_data:
            fb_df = pd.DataFrame(feedback_data)
            fb_df.rename(columns={'complaint__category__name': 'category'}, inplace=True)
            avg_ratings = fb_df.groupby('category')['rating'].mean().reset_index()
            avg_ratings.rename(columns={'rating': 'avg_satisfaction'}, inplace=True)
            avg_ratings['avg_satisfaction'] = np.round(avg_ratings['avg_satisfaction'], 2)
            rating_map = dict(zip(avg_ratings['category'], avg_ratings['avg_satisfaction']))
        else:
            rating_map = {}

        for cat in categories:
            cat['avg_satisfaction'] = rating_map.get(cat['category'], 0.0)

        return categories

    @staticmethod
    def get_official_performance(date_from=None, date_to=None):
        qs = Complaint.objects.filter(assigned_to__isnull=False).select_related('assigned_to', 'assigned_to__department')
        if date_from:
            qs = qs.filter(created_at__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__lte=date_to)

        data = list(qs.values(
            'id', 'status', 'assigned_to_id', 'assigned_to__full_name',
            'assigned_to__department__name',
        ))
        if not data:
            return []

        df = pd.DataFrame(data)
        df.rename(columns={
            'assigned_to__full_name': 'official',
            'assigned_to__department__name': 'department',
        }, inplace=True)
        df['department'] = df['department'].fillna('Unassigned')

        feedback_qs = Feedback.objects.filter(complaint__assigned_to__isnull=False)
        if date_from:
            feedback_qs = feedback_qs.filter(created_at__gte=date_from)
        if date_to:
            feedback_qs = feedback_qs.filter(created_at__lte=date_to)
        feedback_data = list(feedback_qs.values('complaint__assigned_to_id', 'rating'))
        rating_map = {}
        if feedback_data:
            fb_df = pd.DataFrame(feedback_data)
            avg_ratings = fb_df.groupby('complaint__assigned_to_id')['rating'].mean().round(2)
            rating_map = avg_ratings.to_dict()

        result = df.groupby(['assigned_to_id', 'official', 'department']).agg(
            total=('id', 'count'),
            resolved=('status', lambda x: int((x.isin(['resolved', 'closed'])).sum())),
        ).reset_index()
        result['resolution_rate'] = np.where(
            result['total'] > 0,
            np.round((result['resolved'] / result['total']) * 100, 2),
            0.0,
        )
        result['avg_satisfaction'] = result['assigned_to_id'].map(lambda oid: rating_map.get(oid, 0.0))
        result.drop(columns=['assigned_to_id'], inplace=True)
        return result.to_dict('records')
