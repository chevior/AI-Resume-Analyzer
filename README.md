# ResumeNova

ResumeNova is a full-stack AI resume analyzer for job seekers who want a clearer, more practical application workflow. It reviews PDF resumes, calculates ATS readiness, extracts skills, identifies keyword gaps, compares job descriptions, and turns the analysis into interview prep, role targeting, progress tracking, and an application kit.

The app uses a Flask backend for parsing and analysis, plus a React frontend for the ResumeNova dashboard.

## What ResumeNova Does

- Upload and analyze PDF resumes.
- Calculate an ATS readiness score.
- Extract technical skills and missing high-value keywords.
- Compare resume skills against a pasted job description.
- Generate role-specific mock interview preparation.
- Review formatting, strengths, weaknesses, and improvement tips.
- Rank job-role matches from detected skills.
- Track progress across readiness, skills, gaps, and target-role fit.
- Build an action plan with priority and effort labels.
- Generate an application kit with cover-note bullets, checklist, and follow-up guidance.
- Download a text report.
- Support username/password auth and GitHub OAuth.

## Frontend Experience

The React UI is organized as a top-navigation dashboard:

- **Dashboard**: upload flow, ATS score, keyword match, readiness, formatting checks, skills, gaps, and next actions.
- **Mock Interviews**: a staged interview preview before upload, then generated interview prompts after analysis.
- **Resume Analyzer**: ATS/checklist preview before upload, then resume strengths, weaknesses, formatting, and improvement tips.
- **Jobs**: role-match preview before upload, then ranked job matches after analysis.
- **Progress**: milestone tracker before upload, then live readiness/progress data.
- **Action Plan**: prioritized improvement roadmap.
- **Application Kit**: recruiter pitch, cover-note bullets, checklist, and follow-up copy.
- **Questions**: categorized interview question bank.
- **Insight**: positioning, keywords, role fit, and priority recommendations.

## Tech Stack

- **Frontend**: React, Axios, CSS
- **Backend**: Flask, Flask-CORS
- **Resume parsing**: pdfplumber / pdfminer
- **Authentication**: Flask routes with Werkzeug password hashing
- **OAuth**: GitHub OAuth routes

## Project Structure

```text
AI-Resume-Analyzer/
  backend/
    app.py
    routes/
    services/
    models/
    requirements.txt
    .env.example
  frontend/
    public/
    src/
    package.json
  README.md
```

## Getting Started

### 1. Clone

```bash
git clone https://github.com/chevior/AI-Resume-Analyzer.git
cd AI-Resume-Analyzer
```

### 2. Run the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Backend URL:

```text
http://127.0.0.1:5000
```

Useful checks:

```text
http://127.0.0.1:5000/api/health
http://127.0.0.1:5000/api/info
```

### 3. Run the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

Frontend URL:

```text
http://localhost:3000
```

## Build the Frontend

```bash
cd frontend
npm run build
```

The Flask app is configured to serve the React production build when available. After building, restart the backend and open:

```text
http://127.0.0.1:5000
```

## Demo Accounts

```text
username: user
password: user123
```

```text
username: admin
password: admin123
```

## GitHub OAuth

Copy `backend/.env.example` and configure:

```text
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
```

If these values are not configured, the GitHub login route returns a setup error instead of starting OAuth.

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
| POST | `/api/github/connect` | Connect GitHub profile data |
| POST | `/api/github/disconnect` | Disconnect GitHub profile data |
| POST | `/api/resume/upload` | Upload and analyze a PDF resume |
| GET | `/api/resume/metadata` | Describe backend-calculated feature metadata |
| POST | `/api/resume/job-match` | Compare resume skills with a job description |

## Analysis Flow

When a resume is uploaded, the backend:

1. Extracts text from the PDF.
2. Detects technical skills.
3. Calculates ATS readiness.
4. Finds missing keywords.
5. Generates strengths, weaknesses, and improvement tips.
6. Suggests job roles and role-fit scores.
7. Builds mock interview questions.
8. Produces readiness, progress, action-plan, application-kit, questions, and insight metadata.
9. Sends structured results to the React dashboard.

## Development Notes

- User data is stored in memory for development.
- Uploaded files are processed during the request and are not persisted by default.
- For production, replace in-memory user storage with a database.
- Add persistent report/history storage before using the app with real users.
- Configure GitHub OAuth credentials before enabling GitHub sign-in.

