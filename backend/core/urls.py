from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.views.static import serve as static_serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/complaints/', include('complaints.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/evaluation/', include('evaluation.urls')),
    path('api/ai/', include('ai.urls')),
    path('api/notifications/', include('notifications.urls')),
]

# Serves uploaded media (e.g. complaint photos) in all environments, not just
# DEBUG. Django's own static() helper only does this when DEBUG=True, which
# left production with no way to serve /media/ at all. Fine for this app's
# scale; a dedicated object store (S3, etc.) would be the next step if
# traffic/storage needs grow. Note Render's free-tier disk is ephemeral, so
# uploaded files won't survive a redeploy there regardless of this route.
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', static_serve, {'document_root': settings.MEDIA_ROOT}),
]
