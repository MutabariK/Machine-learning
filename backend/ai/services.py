"""
AI-powered services for the Nairobi County Citizen Engagement Platform.

Uses Claude API for intelligent complaint processing, categorization,
response drafting, and natural language analytics queries.
"""
import os
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

SYSTEM_PROMPT = """You are an AI assistant for the Nairobi County Citizen Engagement Platform.
You help citizens report public service issues and help county officials manage complaints efficiently.

Your role:
- Help citizens file complaints clearly and accurately
- Suggest appropriate categories for complaints
- Help officials draft professional responses
- Provide insights from complaint data
- Answer questions about the platform and Nairobi County services

Be professional, empathetic, and culturally aware of Nairobi/Kenya context.
Always respond in a helpful, concise manner. Use Kenyan English conventions.
When helping with complaints, focus on actionable details: what, where, when, severity."""

CATEGORY_KEYWORDS = {
    'Water Services': [
        'water', 'pipe', 'leak', 'burst', 'supply', 'tap', 'drainage',
        'sewage', 'flood', 'sewer', 'borehole', 'tank', 'contaminated',
    ],
    'Road Maintenance': [
        'road', 'pothole', 'highway', 'street', 'pavement', 'tarmac',
        'traffic', 'matatu', 'parking', 'bridge', 'footpath', 'sidewalk',
    ],
    'Waste Management': [
        'waste', 'garbage', 'trash', 'rubbish', 'dump', 'bin', 'collection',
        'litter', 'recycling', 'sanitation', 'dumpsite', 'uncollected',
    ],
}


def suggest_category(title: str, description: str) -> dict:
    """Suggest complaint category using keyword matching."""
    text = f"{title} {description}".lower()
    scores = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scores[category] = score

    if not scores:
        return {
            'suggested_category': None,
            'confidence': 0,
            'alternatives': list(CATEGORY_KEYWORDS.keys()),
            'message': 'Could not determine category. Please select manually.',
        }

    sorted_cats = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top = sorted_cats[0]
    confidence = min(top[1] / 3.0, 1.0)

    return {
        'suggested_category': top[0],
        'confidence': round(confidence, 2),
        'alternatives': [name for name, _ in sorted_cats[1:4]],
        'message': f'Suggested: {top[0]} (confidence: {confidence:.0%})',
    }


def analyze_complaint_priority(title: str, description: str, category: str) -> dict:
    """Analyze complaint priority based on content signals."""
    text = f"{title} {description}".lower()

    urgency_keywords = {
        'critical': ['emergency', 'danger', 'life-threatening', 'collapse', 'flooding',
                     'fire', 'outbreak', 'contaminated', 'electrocution', 'death'],
        'high': ['urgent', 'severe', 'blocked', 'broken', 'burst', 'overflow',
                 'health hazard', 'children', 'elderly', 'hospital', 'accident'],
        'medium': ['damaged', 'leaking', 'poor', 'inadequate', 'delayed', 'missing',
                   'faulty', 'deteriorating', 'unreliable'],
        'low': ['minor', 'cosmetic', 'improvement', 'suggestion', 'request',
                'enhancement', 'future', 'consideration'],
    }

    priority = 'medium'
    matched_keywords = []

    for level in ['critical', 'high', 'medium', 'low']:
        for kw in urgency_keywords[level]:
            if kw in text:
                priority = level
                matched_keywords.append(kw)
                break
        if matched_keywords:
            break

    priority_scores = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
    impact_multiplier = 1.0
    community_words = ['community', 'neighborhood', 'estate', 'residents', 'public', 'everyone']
    if any(w in text for w in community_words):
        impact_multiplier = 1.5

    return {
        'priority': priority,
        'score': round(priority_scores[priority] * impact_multiplier, 1),
        'matched_signals': matched_keywords,
        'community_impact': impact_multiplier > 1.0,
        'recommendation': _get_priority_recommendation(priority),
    }


def _get_priority_recommendation(priority: str) -> str:
    recommendations = {
        'critical': 'Requires immediate attention. Assign to senior official and notify department head.',
        'high': 'Should be addressed within 24 hours. Assign to available official.',
        'medium': 'Standard processing timeline (3-7 working days). Follow normal routing.',
        'low': 'Can be scheduled for routine maintenance. No rush needed.',
    }
    return recommendations.get(priority, '')


def draft_response(complaint_title: str, complaint_description: str,
                   status: str, category: str, official_name: str = "County Official") -> dict:
    """Draft a professional response for a complaint status update."""
    templates = {
        'under_review': (
            f"Dear Citizen,\n\n"
            f"Thank you for reporting this issue regarding {category.lower()}. "
            f"Your complaint \"{complaint_title}\" has been received and is now under review "
            f"by the relevant department.\n\n"
            f"We will assess the situation and update you on the next steps. "
            f"Please allow 5-10 working days for initial assessment.\n\n"
            f"Reference your complaint ID for any follow-up inquiries.\n\n"
            f"Regards,\n{official_name}\nNairobi County Services"
        ),
        'in_progress': (
            f"Dear Citizen,\n\n"
            f"We wish to inform you that your complaint \"{complaint_title}\" "
            f"is now being actively addressed by our {category} team.\n\n"
            f"Our team is working on the ground to resolve this issue. "
            f"Estimated completion: 3-7 working days depending on complexity.\n\n"
            f"We appreciate your patience and engagement with county services.\n\n"
            f"Regards,\n{official_name}\nNairobi County Services"
        ),
        'resolved': (
            f"Dear Citizen,\n\n"
            f"We are pleased to inform you that your complaint \"{complaint_title}\" "
            f"has been resolved.\n\n"
            f"We value your feedback. Please rate your satisfaction with the resolution "
            f"through the platform to help us improve our services.\n\n"
            f"Thank you for using the Nairobi County Citizen Engagement Platform.\n\n"
            f"Regards,\n{official_name}\nNairobi County Services"
        ),
    }

    draft = templates.get(status)
    if not draft:
        draft = (
            f"Dear Citizen,\n\n"
            f"This is an update regarding your complaint \"{complaint_title}\".\n"
            f"Current status: {status.replace('_', ' ').title()}.\n\n"
            f"We will continue to keep you informed of any developments.\n\n"
            f"Regards,\n{official_name}\nNairobi County Services"
        )

    return {
        'draft': draft,
        'status': status,
        'editable': True,
        'note': 'This is an AI-generated draft. Please review and customize before sending.',
    }


def process_chat_message(message: str, user_role: str, context: dict = None) -> dict:
    """Process a chat message and return an AI-generated response.

    Uses Claude API if available, falls back to rule-based responses.
    """
    if ANTHROPIC_API_KEY:
        return _claude_chat(message, user_role, context)
    return _rule_based_chat(message, user_role, context)


def _claude_chat(message: str, user_role: str, context: dict = None) -> dict:
    """Process chat using Claude API."""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

        system = SYSTEM_PROMPT + f"\n\nCurrent user role: {user_role}"
        if context:
            system += f"\n\nContext: {json.dumps(context)}"

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=system,
            messages=[{"role": "user", "content": message}],
        )

        return {
            'response': response.content[0].text,
            'source': 'claude',
        }
    except Exception as e:
        logger.warning(f"Claude API error: {e}")
        return _rule_based_chat(message, user_role, context)


def _rule_based_chat(message: str, user_role: str, context: dict = None) -> dict:
    """Fallback rule-based chat responses."""
    msg_lower = message.lower()

    if user_role == 'citizen':
        return _citizen_chat(msg_lower, message)
    elif user_role in ('official', 'admin'):
        return _official_chat(msg_lower, message)

    return {
        'response': (
            "Welcome to the Nairobi County Citizen Engagement Platform! "
            "I can help you with:\n"
            "- Filing complaints about public services\n"
            "- Checking complaint status\n"
            "- Understanding the complaint process\n"
            "- Finding the right category for your issue\n\n"
            "How can I assist you today?"
        ),
        'source': 'rules',
    }


def _citizen_chat(msg_lower: str, original: str) -> dict:
    if any(w in msg_lower for w in ['submit', 'file', 'report', 'complaint', 'new']):
        return {
            'response': (
                "To submit a complaint:\n"
                "1. Go to **Submit Complaint** from the side menu\n"
                "2. Select the appropriate **Category** (e.g., Waste Management, Road Maintenance)\n"
                "3. Choose your **Ward** if applicable\n"
                "4. Provide a clear **Title** describing the issue\n"
                "5. Add detailed **Description** with specifics\n"
                "6. Enter the **Location** (be specific, e.g., 'Ngong Road near Adams Arcade')\n"
                "7. Optionally upload a **Photo** as evidence\n\n"
                "Would you like help choosing the right category?"
            ),
            'source': 'rules',
            'actions': [{'type': 'navigate', 'path': '/submit-complaint', 'label': 'Submit Complaint'}],
        }

    if any(w in msg_lower for w in ['status', 'track', 'check', 'progress', 'my complaint']):
        return {
            'response': (
                "You can track your complaints through **My Complaints** in the side menu.\n\n"
                "Complaint statuses:\n"
                "- **Submitted** - Received, awaiting review\n"
                "- **Under Review** - Being assessed by officials\n"
                "- **In Progress** - Actively being resolved\n"
                "- **Resolved** - Issue addressed\n"
                "- **Closed** - Final state\n\n"
                "Click the eye icon on any complaint to see full details and timeline."
            ),
            'source': 'rules',
            'actions': [{'type': 'navigate', 'path': '/my-complaints', 'label': 'View My Complaints'}],
        }

    if any(w in msg_lower for w in ['category', 'type', 'what kind', 'which']):
        categories = list(CATEGORY_KEYWORDS.keys())
        cat_list = '\n'.join(f"- **{c}**" for c in categories)
        return {
            'response': f"Available complaint categories:\n{cat_list}\n\nDescribe your issue and I can suggest the best category.",
            'source': 'rules',
        }

    if any(w in msg_lower for w in ['water', 'pipe', 'road', 'pothole', 'garbage', 'waste',
                                       'security', 'light', 'health', 'noise', 'pollution']):
        suggestion = suggest_category(original, original)
        if suggestion['suggested_category']:
            return {
                'response': (
                    f"Based on your description, I'd suggest the category: **{suggestion['suggested_category']}**.\n\n"
                    f"Would you like to submit a complaint under this category? "
                    f"Go to **Submit Complaint** and select it."
                ),
                'source': 'rules',
                'suggestion': suggestion,
                'actions': [{'type': 'navigate', 'path': '/submit-complaint', 'label': 'Submit Complaint'}],
            }

    return {
        'response': (
            "I'm here to help you with Nairobi County services! You can ask me about:\n\n"
            "- **How to submit a complaint**\n"
            "- **Checking complaint status**\n"
            "- **Choosing the right category** for your issue\n"
            "- **Understanding the resolution process**\n\n"
            "Or describe your issue directly and I'll guide you!"
        ),
        'source': 'rules',
    }


def _official_chat(msg_lower: str, original: str) -> dict:
    if any(w in msg_lower for w in ['summary', 'overview', 'stats', 'analytics', 'report']):
        return {
            'response': (
                "You can view comprehensive analytics on the **Analytics** page:\n\n"
                "- Total complaints, resolution rates, response times\n"
                "- Breakdown by category, ward, and status\n"
                "- Trend analysis (daily/weekly/monthly)\n"
                "- Service performance metrics\n"
                "- CSV export for detailed reporting\n\n"
                "Use the time period filters to narrow down your analysis."
            ),
            'source': 'rules',
            'actions': [{'type': 'navigate', 'path': '/analytics', 'label': 'View Analytics'}],
        }

    if any(w in msg_lower for w in ['pending', 'unresolved', 'backlog', 'queue']):
        return {
            'response': (
                "To manage pending complaints:\n\n"
                "1. Go to **Complaints** page\n"
                "2. Filter by Status: **Submitted** or **Under Review**\n"
                "3. Click the edit icon to update status\n"
                "4. Add resolution notes as you progress\n\n"
                "Prioritize based on submission date and urgency indicators."
            ),
            'source': 'rules',
            'actions': [{'type': 'navigate', 'path': '/complaints', 'label': 'Manage Complaints'}],
        }

    if any(w in msg_lower for w in ['priority', 'priorities', 'urgent', 'urgency', 'severity']):
        return {
            'response': (
                "Complaint priority is inferred automatically from each complaint's title and description:\n\n"
                "- **Critical** — emergencies or danger to life (e.g. fire, flooding, contamination). Requires immediate attention.\n"
                "- **High** — urgent or hazardous issues, or ones involving children, the elderly, or broken infrastructure. Address within 24 hours.\n"
                "- **Medium** — standard issues such as damage or delays. Normal processing timeline (3–7 working days).\n"
                "- **Low** — minor or cosmetic requests. Can be scheduled for routine maintenance.\n\n"
                "A complaint mentioning wider community impact (e.g. 'neighborhood' or 'residents') is weighted higher. "
                "Use this alongside submission date when deciding which complaints in your queue to handle first."
            ),
            'source': 'rules',
            'actions': [{'type': 'navigate', 'path': '/complaints', 'label': 'View Complaints'}],
        }

    if any(w in msg_lower for w in ['draft', 'response', 'reply', 'respond']):
        return {
            'response': (
                "I can help draft responses! When updating a complaint, use the AI Draft feature:\n\n"
                "1. Select the complaint from the **Complaints** page\n"
                "2. Click the edit icon\n"
                "3. Choose the new status\n"
                "4. Use **AI Draft** to generate a professional response\n"
                "5. Review and customize before saving\n\n"
                "Tell me the complaint details and I can draft a response right here."
            ),
            'source': 'rules',
        }

    return {
        'response': (
            "As a county official, I can help you with:\n\n"
            "- **Analytics overview** and reporting\n"
            "- **Managing pending complaints**\n"
            "- **Drafting professional responses**\n"
            "- **Understanding complaint priorities**\n"
            "- **Performance metrics** for your department\n\n"
            "What would you like help with?"
        ),
        'source': 'rules',
    }
