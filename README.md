lsof -ti:8000 | xargs kill
cd /Users/sharngi2/Documents/Recruitment_Website/recuitment-website/devops-oa-backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000


ADMIN_PASSWORD=local-admin-123
