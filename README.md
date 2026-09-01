# Recruitment Website

Local development instructions for the frontend and backend in this repository.

## Project Structure

- `.`: Vite + React frontend
- `devops-oa-backend/`: FastAPI backend

## Local URLs

- Frontend: `http://localhost:8080/`
- Tech manage route: `http://localhost:8080/#/tech/manage`
- Backend API: `http://127.0.0.1:8000/`

## Frontend

From the repository root:

```bash
npm run dev -- --host 127.0.0.1 --port 8080
```

Then open:

```text
http://localhost:8080/
```

## Backend

From `devops-oa-backend/`:

```bash
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

If `uvicorn` is not found, run it directly from the virtual environment:

```bash
./.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```

## First-Time Backend Setup

If the virtual environment or dependencies are missing:

```bash
cd devops-oa-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment

The frontend is configured in `.env` to call the backend locally:

```env
VITE_OA_API_URL=http://localhost:8000
```

## Common Issue

If backend startup fails with `address already in use`, something is already bound to port `8000`.

Check what is using the port:

```bash
lsof -i :8000
```

If the existing backend is already running, reuse it. Otherwise stop the old process and start the server again:

```bash
lsof -ti :8000 | xargs kill
uvicorn main:app --host 127.0.0.1 --port 8000
```
