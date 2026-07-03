# ResumeNova

ResumeNova is an AI resume analyzer that helps job seekers review resumes, calculate ATS readiness, extract skills, find keyword gaps, generate mock interview questions, and compare a resume against job descriptions.

The project uses a Flask backend for resume processing and metadata generation, with a React frontend for the dashboard experience.

## Features

- PDF resume upload and text extraction
- ATS score calculation
- Skill extraction and missing keyword detection
- Backend-generated metadata for:
  - Mock Interviews
  - Resume Analyzer
  - Jobs
  - Progress
  - Questions
  - Insight
- Job description matching
- Backend-verified user profile data
- Login, registration, and GitHub OAuth support
- Light and dark UI theme
- Downloadable text report

## Tech Stack

- Frontend: React, Axios, CSS
- Backend: Flask, Flask-CORS
- Resume parsing: pdfplumber / pdfminer
- Auth: Flask routes with Werkzeug password hashing

## Project Structure

```text
AI-Resume-Analyzer/
  backend/
    app.py
    routes/
    services/
    models/
    requirements.txt
  frontend/
    public/
    src/
    package.json
  README.md
```

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd AI-Resume-Analyzer
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The backend runs at:

```text
http://127.0.0.1:5000
```

Health check:

```text
http://127.0.0.1:5000/api/health
```

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

The frontend runs at:

```text
http://localhost:3000
```

## Build Frontend for Flask

To build the React app so Flask can serve it:

```bash
cd frontend
npm run build
```

Then start or restart the backend:

```bash
cd ../backend
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | Backend health check |
| GET | `/api/info` | App information and route list |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login a user |
| GET | `/api/auth/profile/<username>` | Backend-verified public user profile |
| POST | `/api/auth/subscribe` | Update subscription plan |
| GET | `/api/github/login` | Start GitHub OAuth |
| POST | `/api/github/callback` | Complete GitHub OAuth |
| POST | `/api/resume/upload` | Upload and analyze a PDF resume |
| GET | `/api/resume/metadata` | Describe backend-calculated feature metadata |
| POST | `/api/resume/job-match` | Compare resume skills with a job description |

## Demo Login

```text
username: user
password: user123
```

Admin demo:

```text
username: admin
password: admin123
```

## How Resume Analysis Works

When a PDF is uploaded, the backend:

1. Extracts resume text.
2. Detects known technical skills.
3. Calculates ATS score.
4. Finds missing high-value keywords.
5. Generates interview questions.
6. Ranks suggested jobs by skill match.
7. Builds progress, questions, insights, and analyzer metadata.
8. Sends the structured result to the React dashboard.

## Notes

- User data is currently stored in memory for development.
- Uploaded resume files are processed in request memory and are not persisted by default.
- For production, replace the in-memory user store with a database and add persistent report/history storage.

