from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .services import (
    suggest_category, analyze_complaint_priority,
    draft_response, process_chat_message,
)


class CategorySuggestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        if not title and not description:
            return Response(
                {'error': 'Provide title or description'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = suggest_category(title, description)
        return Response(result)


class PriorityAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        category = request.data.get('category', '')
        if not title:
            return Response(
                {'error': 'Title is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = analyze_complaint_priority(title, description, category)
        return Response(result)


class DraftResponseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ('official', 'admin'):
            return Response(
                {'error': 'Only officials can draft responses'},
                status=status.HTTP_403_FORBIDDEN,
            )
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        new_status = request.data.get('status', 'under_review')
        category = request.data.get('category', '')

        result = draft_response(
            complaint_title=title,
            complaint_description=description,
            status=new_status,
            category=category,
            official_name=request.user.full_name,
        )
        return Response(result)


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'ai_chat'

    def post(self, request):
        message = request.data.get('message', '').strip()
        if not message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(message) > 2000:
            return Response(
                {'error': 'Message too long (max 2000 characters)'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        context = {
            'user_name': request.user.full_name,
            'user_role': request.user.role,
        }

        result = process_chat_message(
            message=message,
            user_role=request.user.role,
            context=context,
        )
        return Response(result)
