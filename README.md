# Nairobi County Citizen Engagement Platform

A civic-tech platform that lets citizens report public service issues (roads, water, waste, security, health, etc.) to Nairobi County and lets county officials triage, track, and resolve them. Includes an AI assistant for complaint categorization, response drafting, and natural-language analytics.

## Tech Stack

- **Backend:** Django 4.2 + Django REST Framework, JWT auth (`djangorestframework-simplejwt`), PostgreSQL (via `dj-database-url`, SQLite for local dev)
- **Frontend:** React 18 + TypeScript, Material UI (MUI), Chart.js, React Router
- **AI:** Anthropic Claude API (`anthropic` SDK) and an MCP server (`mcp_server.py`)
- **Deployment:** Render (`render.yaml`) — Gunicorn for the backend, static build for the frontend

## Project Structure

```
backend/
  core/          Django project settings, URLs, WSGI
  users/         Custom user model (citizen / official / admin roles), auth
  complaints/    Complaints, categories, wards, status history, feedback
  evaluation/    Complaint/official evaluation
  analytics/     Reporting and dashboard data
  ai/            Claude-powered categorization, drafting, NL analytics
  notifications/ User notifications
  mcp_server.py  Model Context Protocol server
frontend/
  src/           React + TypeScript application
```

## Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Environment variables (see `backend/core/settings.py`):

- `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`
- `DATABASE_URL` (falls back to local SQLite if unset)
- `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`
- `ANTHROPIC_API_KEY` (for AI features)

## Frontend Setup

```bash
cd frontend
npm install
npm start
```

Environment variable:

- `REACT_APP_API_URL` — backend API base URL

## Roles

- **Citizen** — submits and tracks complaints, leaves feedback
- **County Official** — manages complaints assigned to their department/category
- **Administrator** — full platform oversight

## Deployment

`render.yaml` provisions a free-tier Postgres database, a Django web service (`nairobi-backend`), and a static frontend site (`nairobi-frontend`) on [Render](https://render.com).
