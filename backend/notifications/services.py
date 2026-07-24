from .models import Notification

STATUS_LABELS = {
    'submitted': 'Submitted',
    'under_review': 'Under Review',
    'in_progress': 'In Progress',
    'resolved': 'Resolved',
    'closed': 'Closed',
}


def notify_status_change(complaint, old_status, new_status):
    if old_status == new_status:
        return
    label = STATUS_LABELS.get(new_status, new_status)
    Notification.objects.create(
        recipient=complaint.citizen,
        complaint=complaint,
        message=f'Your complaint "{complaint.title}" is now {label}.',
    )


def notify_assignment(complaint):
    if not complaint.assigned_to:
        return
    Notification.objects.create(
        recipient=complaint.assigned_to,
        complaint=complaint,
        message=f'You have been assigned complaint "{complaint.title}".',
    )
