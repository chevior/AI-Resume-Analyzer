ROLE_CATALOG = [
    {
        "role": "Frontend Developer",
        "company": "Interface Labs",
        "required_skills": ["react", "javascript", "typescript", "html", "css", "rest api"],
    },
    {
        "role": "Backend Developer",
        "company": "APIWorks",
        "required_skills": ["python", "java", "flask", "django", "sql", "postgresql", "docker"],
    },
    {
        "role": "Full Stack Engineer",
        "company": "CloudMint",
        "required_skills": ["react", "node.js", "python", "sql", "aws", "git"],
    },
    {
        "role": "Data Analyst",
        "company": "MetricWorks",
        "required_skills": ["python", "sql", "excel", "pandas", "tableau", "power bi"],
    },
    {
        "role": "Machine Learning Intern",
        "company": "ModelHub",
        "required_skills": ["python", "machine learning", "ai", "numpy", "pandas", "sql"],
    },
]

HIGH_VALUE_KEYWORDS = [
    "docker", "kubernetes", "aws", "ci/cd", "postgresql", "rest api",
    "testing", "github", "agile", "graphql"
]


def _contains_any(text_lower, terms):
    return any(term in text_lower for term in terms)


def _role_match(skills_lower, required_skills):
    matched = [skill for skill in required_skills if skill in skills_lower]
    missing = [skill for skill in required_skills if skill not in skills_lower]
    score = round((len(matched) / len(required_skills)) * 100) if required_skills else 0
    return matched, missing, score


def build_resume_metadata(text, skills, ats_score, word_count, recommendations, questions):
    text_lower = text.lower()
    skills_lower = [skill.lower() for skill in skills]
    missing_keywords = [keyword for keyword in HIGH_VALUE_KEYWORDS if keyword not in skills_lower and keyword not in text_lower]

    formatting_checks = [
        {
            "label": "Clean, ATS-friendly text extraction",
            "status": "pass" if word_count >= 180 else "warn",
            "detail": "Enough readable resume text was found." if word_count >= 180 else "Resume text is short; add role summary, projects, and experience.",
        },
        {
            "label": "Standard resume sections detected",
            "status": "pass" if _contains_any(text_lower, ["experience", "projects", "education", "skills"]) else "warn",
            "detail": "Common section labels help ATS parsing.",
        },
        {
            "label": "Measurable impact included",
            "status": "pass" if _contains_any(text_lower, ["%", "improved", "increased", "reduced", "optimized"]) else "warn",
            "detail": "Use numbers such as accuracy, speed, revenue, time saved, or user growth.",
        },
        {
            "label": "Portfolio or GitHub proof linked",
            "status": "pass" if _contains_any(text_lower, ["github", "linkedin", "portfolio", "http"]) else "warn",
            "detail": "Links make project claims easier to verify.",
        },
    ]

    jobs = []
    for role in ROLE_CATALOG:
        matched, missing, score = _role_match(skills_lower, role["required_skills"])
        jobs.append({
            "role": role["role"],
            "company": role["company"],
            "match": score,
            "matched_skills": matched,
            "missing_skills": missing,
            "skills": role["required_skills"][:4],
            "recommendation": "Strong fit" if score >= 70 else f"Add {', '.join(missing[:3])}",
        })
    jobs = sorted(jobs, key=lambda item: item["match"], reverse=True)

    strengths = []
    if len(skills) >= 6:
        strengths.append("Broad technical skill coverage across the resume.")
    if _contains_any(text_lower, ["project", "projects"]):
        strengths.append("Project experience is visible for recruiter review.")
    if _contains_any(text_lower, ["intern", "experience", "worked"]):
        strengths.append("Experience keywords are present.")
    if _contains_any(text_lower, ["github", "linkedin", "portfolio"]):
        strengths.append("Proof links are included.")

    weaknesses = []
    if len(skills) < 5:
        weaknesses.append("Add more target-role technical keywords.")
    if not _contains_any(text_lower, ["%", "improved", "increased", "reduced", "optimized"]):
        weaknesses.append("Add measurable outcomes to project and experience bullets.")
    if not _contains_any(text_lower, ["github", "linkedin", "portfolio", "http"]):
        weaknesses.append("Add GitHub, LinkedIn, or portfolio links.")
    if word_count < 250:
        weaknesses.append("Resume content is short; expand responsibilities and achievements.")

    progress_items = [
        {"label": "ATS readiness", "value": round(ats_score), "unit": "%"},
        {"label": "Skills detected", "value": len(skills), "unit": ""},
        {"label": "Priority gaps", "value": len(missing_keywords), "unit": ""},
        {"label": "Best job fit", "value": jobs[0]["match"] if jobs else 0, "unit": "%"},
    ]

    interview_questions = questions + [
        f"Walk me through a project where you used {skills[0]}." if skills else "Walk me through your strongest technical project.",
        "Tell me about a time you improved performance, accuracy, or reliability.",
        "Which missing skill would you learn first for your target role, and why?",
    ]

    insights = recommendations + weaknesses + [
        f"Best current role fit: {jobs[0]['role']} at {jobs[0]['match']}%." if jobs else "Upload a richer resume to calculate role fit.",
        "Tailor the top third of your resume to each job description before applying.",
    ]

    return {
        "dashboard": {
            "headline": "Resume analysis complete",
            "summary": f"{round(ats_score)}% ATS readiness with {len(skills)} skills detected.",
            "formatting_checks": formatting_checks,
            "keyword_match": max(0, min(100, round(ats_score + (len(skills) * 2) - (len(missing_keywords) * 3)))),
        },
        "mock_interview": {
            "title": "Mock interview generated from resume skills",
            "difficulty": "Advanced" if ats_score >= 80 else "Intermediate" if ats_score >= 60 else "Foundational",
            "questions": interview_questions[:8],
            "focus_areas": skills[:5] or ["projects", "communication", "problem solving"],
        },
        "resume_analyzer": {
            "strengths": strengths or ["Solid baseline resume structure detected."],
            "weaknesses": weaknesses or ["No major resume weaknesses detected by current checks."],
            "formatting_checks": formatting_checks,
            "resume_preview": text[:900],
        },
        "jobs": jobs,
        "progress": {
            "items": progress_items,
            "next_steps": [
                "Add 2 quantified achievements.",
                "Add proof links for your strongest projects.",
                "Compare the resume against one target job description.",
                "Practice answers for the generated interview questions.",
            ],
        },
        "questions": {
            "interview": interview_questions[:8],
            "screening": [
                "What role are you targeting and why?",
                "Which project best proves your fit?",
                "What result can you quantify from your experience?",
            ],
        },
        "insights": {
            "recommendations": insights,
            "missing_high_value_keywords": missing_keywords,
            "best_role": jobs[0] if jobs else None,
        },
    }
