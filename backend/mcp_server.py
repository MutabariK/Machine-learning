"""
MCP Server for Nairobi County Citizen Engagement Platform.

Exposes platform tools via Model Context Protocol, enabling AI assistants
to query complaints, analytics, and manage platform operations.

SECURITY: this server is a local stdio tool only (e.g. for a Claude Desktop
/ IDE MCP client running on the same machine as the database). It is not
part of the deployed web services in render.yaml and performs no
authentication of its own — anyone able to invoke this process has full
read access to complaint and user data. Never change the transport below
to "sse" or "streamable-http" (network-reachable) without first adding
proper bearer-token/OAuth verification via mcp.server.auth; doing so as-is
would expose the entire database with no access control.

Run: python mcp_server.py
"""
import os
import sys
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from mcp.server.fastmcp import FastMCP
from complaints.models import Complaint, Category, Ward, Feedback
from analytics.services import AnalyticsService
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

mcp = FastMCP(
    "Nairobi Platform",
    instructions="Nairobi County Citizen Engagement Platform - complaint management, analytics, and citizen services",
)


@mcp.tool()
def search_complaints(
    status: str = "",
    category: str = "",
    ward: str = "",
    search: str = "",
    limit: int = 20,
) -> str:
    """Search and filter complaints in the Nairobi County platform.

    Args:
        status: Filter by status (submitted, under_review, in_progress, resolved, closed)
        category: Filter by category name
        ward: Filter by ward name
        search: Search in title and description
        limit: Max results to return (default 20)
    """
    qs = Complaint.objects.select_related('category', 'ward', 'citizen', 'assigned_to')

    if status:
        qs = qs.filter(status=status)
    if category:
        qs = qs.filter(category__name__icontains=category)
    if ward:
        qs = qs.filter(ward__name__icontains=ward)
    if search:
        from django.db.models import Q
        qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

    complaints = []
    for c in qs[:limit]:
        complaints.append({
            'id': c.id,
            'title': c.title,
            'category': c.category.name,
            'ward': c.ward.name if c.ward else None,
            'status': c.status,
            'location': c.location,
            'citizen': c.citizen.full_name,
            'assigned_to': c.assigned_to.full_name if c.assigned_to else None,
            'created_at': c.created_at.isoformat(),
            'updated_at': c.updated_at.isoformat(),
        })

    return json.dumps({
        'total_found': qs.count(),
        'showing': len(complaints),
        'complaints': complaints,
    }, indent=2)


@mcp.tool()
def get_complaint_details(complaint_id: int) -> str:
    """Get full details of a specific complaint including status history and feedback.

    Args:
        complaint_id: The complaint ID number
    """
    try:
        c = Complaint.objects.select_related(
            'category', 'ward', 'citizen', 'assigned_to'
        ).get(id=complaint_id)
    except Complaint.DoesNotExist:
        return json.dumps({'error': f'Complaint #{complaint_id} not found'})

    history = [
        {
            'old_status': h.old_status,
            'new_status': h.new_status,
            'changed_by': h.changed_by.full_name if h.changed_by else 'System',
            'notes': h.notes,
            'changed_at': h.changed_at.isoformat(),
        }
        for h in c.status_history.select_related('changed_by').all()
    ]

    feedback = None
    try:
        fb = c.feedback
        feedback = {
            'rating': fb.rating,
            'comment': fb.comment,
            'citizen': fb.citizen.full_name,
            'created_at': fb.created_at.isoformat(),
        }
    except Feedback.DoesNotExist:
        pass

    return json.dumps({
        'id': c.id,
        'title': c.title,
        'description': c.description,
        'category': c.category.name,
        'ward': c.ward.name if c.ward else None,
        'location': c.location,
        'latitude': float(c.latitude) if c.latitude else None,
        'longitude': float(c.longitude) if c.longitude else None,
        'status': c.status,
        'citizen': c.citizen.full_name,
        'assigned_to': c.assigned_to.full_name if c.assigned_to else None,
        'resolution_notes': c.resolution_notes,
        'created_at': c.created_at.isoformat(),
        'updated_at': c.updated_at.isoformat(),
        'status_history': history,
        'feedback': feedback,
    }, indent=2)


@mcp.tool()
def get_analytics_summary(days: int = 30) -> str:
    """Get platform analytics summary including complaint counts, resolution rates, and response times.

    Args:
        days: Number of days to look back (default 30)
    """
    date_from = timezone.now() - timedelta(days=days)
    summary = AnalyticsService.get_summary_stats(date_from=date_from)
    by_category = AnalyticsService.get_complaints_by_category(date_from=date_from)
    by_status = AnalyticsService.get_complaints_by_status(date_from=date_from)
    performance = AnalyticsService.get_service_performance(date_from=date_from)

    return json.dumps({
        'period': f'Last {days} days',
        'summary': summary,
        'by_category': by_category,
        'by_status': by_status,
        'service_performance': performance,
    }, indent=2)


@mcp.tool()
def get_complaint_trends(period: str = "daily", days: int = 30) -> str:
    """Get complaint volume trends over time.

    Args:
        period: Aggregation period - daily, weekly, or monthly
        days: Number of days to look back (default 30)
    """
    trends = AnalyticsService.get_complaint_trends(period=period, days=days)
    return json.dumps({'period': period, 'days': days, 'trends': trends}, indent=2)


@mcp.tool()
def list_categories() -> str:
    """List all complaint categories with their complaint counts."""
    categories = []
    for cat in Category.objects.filter(is_active=True):
        categories.append({
            'id': cat.id,
            'name': cat.name,
            'description': cat.description,
            'complaint_count': cat.complaints.count(),
        })
    return json.dumps(categories, indent=2)


@mcp.tool()
def list_wards() -> str:
    """List all wards in Nairobi County with their sub-counties and complaint counts."""
    wards = []
    for w in Ward.objects.filter(is_active=True):
        wards.append({
            'id': w.id,
            'name': w.name,
            'sub_county': w.sub_county,
            'complaint_count': w.complaints.count(),
        })
    return json.dumps(wards, indent=2)


@mcp.tool()
def get_ward_analysis(ward_name: str) -> str:
    """Get detailed analysis for a specific ward including top complaint categories and resolution metrics.

    Args:
        ward_name: Name of the ward to analyze
    """
    try:
        ward = Ward.objects.get(name__icontains=ward_name)
    except Ward.DoesNotExist:
        return json.dumps({'error': f'Ward "{ward_name}" not found'})
    except Ward.MultipleObjectsReturned:
        wards = Ward.objects.filter(name__icontains=ward_name)
        return json.dumps({'error': 'Multiple wards found', 'matches': [w.name for w in wards]})

    complaints = Complaint.objects.filter(ward=ward)
    total = complaints.count()
    resolved = complaints.filter(status__in=['resolved', 'closed']).count()

    by_category = {}
    for c in complaints.select_related('category'):
        cat_name = c.category.name
        by_category.setdefault(cat_name, {'total': 0, 'resolved': 0})
        by_category[cat_name]['total'] += 1
        if c.status in ('resolved', 'closed'):
            by_category[cat_name]['resolved'] += 1

    return json.dumps({
        'ward': ward.name,
        'sub_county': ward.sub_county,
        'total_complaints': total,
        'resolved': resolved,
        'resolution_rate': round((resolved / total * 100), 2) if total > 0 else 0,
        'by_category': by_category,
    }, indent=2)


@mcp.tool()
def suggest_complaint_category(title: str, description: str) -> str:
    """Suggest the best category for a complaint based on its title and description.

    Args:
        title: The complaint title
        description: The complaint description
    """
    categories = list(Category.objects.filter(is_active=True).values_list('name', flat=True))

    keywords_map = {
        'Water': ['water', 'pipe', 'leak', 'supply', 'tap', 'drainage', 'sewage', 'flood'],
        'Roads': ['road', 'pothole', 'highway', 'street', 'pavement', 'tarmac', 'traffic'],
        'Waste Management': ['waste', 'garbage', 'trash', 'rubbish', 'dump', 'bin', 'collection', 'litter'],
        'Security': ['security', 'crime', 'theft', 'robbery', 'safety', 'police', 'light', 'lighting'],
        'Health': ['health', 'hospital', 'clinic', 'medical', 'sanitation', 'disease'],
        'Education': ['school', 'education', 'learning', 'teacher', 'student'],
        'Housing': ['house', 'housing', 'building', 'construction', 'rent', 'shelter'],
        'Environment': ['environment', 'pollution', 'noise', 'air', 'tree', 'park', 'green'],
    }

    text = f"{title} {description}".lower()
    scores = {}

    for cat_name in categories:
        score = 0
        keywords = keywords_map.get(cat_name, [cat_name.lower().split()])
        if isinstance(keywords, list):
            for kw in keywords:
                if kw in text:
                    score += 1
        scores[cat_name] = score

    sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    suggestions = [{'category': name, 'confidence': min(score / 3, 1.0)} for name, score in sorted_cats[:3]]

    return json.dumps({
        'input': {'title': title, 'description': description},
        'suggestions': suggestions,
        'all_categories': categories,
    }, indent=2)


@mcp.resource("platform://stats")
def platform_stats() -> str:
    """Current platform statistics overview."""
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    total_complaints = Complaint.objects.count()
    open_complaints = Complaint.objects.filter(
        status__in=['submitted', 'under_review', 'in_progress']
    ).count()

    return json.dumps({
        'platform': 'Nairobi County Citizen Engagement Platform',
        'total_users': total_users,
        'active_users': active_users,
        'citizens': User.objects.filter(role='citizen').count(),
        'officials': User.objects.filter(role='official').count(),
        'admins': User.objects.filter(role='admin').count(),
        'total_complaints': total_complaints,
        'open_complaints': open_complaints,
        'categories': Category.objects.filter(is_active=True).count(),
        'wards': Ward.objects.filter(is_active=True).count(),
    }, indent=2)


if __name__ == "__main__":
    # Pinned to stdio: see the module docstring before ever changing this.
    mcp.run(transport="stdio")
