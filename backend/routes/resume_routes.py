from flask import Blueprint, request, jsonify
from services.pdf_service import extract_pdf_text
from services.skill_service import extract_skills
from services.ats_service import calculate_ats
from services.interview_service import generate_questions
from services.resume_metadata_service import build_resume_metadata
from models.resume import Resume

resume_bp = Blueprint("resume", __name__)


@resume_bp.route("/metadata", methods=["GET"])
def resume_feature_metadata():
    return jsonify({
        "success": True,
        "features": {
            "mock_interview": "Questions, difficulty, and focus areas generated from resume skills.",
            "resume_analyzer": "Strengths, weaknesses, formatting checks, and resume preview.",
            "jobs": "Suggested job roles ranked by required-skill match.",
            "progress": "ATS readiness, skill coverage, gaps, and next steps.",
            "action_plan": "Prioritized resume fixes with effort and priority labels.",
            "application_kit": "Recruiter pitch, cover-note bullets, and application checklist.",
            "questions": "Interview and recruiter-screening questions.",
            "insights": "Recommendations, high-value missing keywords, and best-role fit.",
        },
        "calculation_source": "All feature metadata is calculated on the backend from uploaded resume text, extracted skills, and ATS score.",
    })

@resume_bp.route("/upload", methods=["POST"])
def upload_resume():
    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]

    text = extract_pdf_text(file)
    if not text:
        return jsonify({"error": "Cannot read PDF"}), 400

    resume = Resume(text)
    skills = extract_skills(text)
    resume.set_skills(skills)

    ats_score = calculate_ats(skills, text)
    questions = generate_questions(skills)
    word_count = len(text.split())
    char_count = len(text)

    recommendations = []
    if len(skills) < 4:
        recommendations.append("Add more relevant technical skills to improve ATS score.")
    if word_count < 250:
        recommendations.append("Expand with achievements, metrics, and key technologies.")
    if not any(skill in skills for skill in ["python", "java", "sql", "react"]):
        recommendations.append("Include strong technical keywords like Python, Java, SQL, or React.")

    # Determine match level
    if ats_score >= 80:
        match_level = "Strong Match"
    elif ats_score >= 60:
        match_level = "Average Match"
    else:
        match_level = "Weak Match"

    # Suggested job roles
    suggested_roles = [
        "Backend Developer",
        "Full Stack Developer",
        "ML Intern",
        "Data Analyst Intern"
    ]

    # Missing skills detector (sample set to highlight common gaps)
    common_skills = ["docker", "aws", "postgresql", "ci/cd"]
    missing_skills = [s for s in common_skills if s not in [sk.lower() for sk in skills]]

    # Strengths / weaknesses heuristics
    strengths = []
    weaknesses = []
    if len(skills) >= 6:
        strengths.append("Good technical skills")
    if "project" in text.lower() or "projects" in text.lower():
        strengths.append("Clear project experience")
    if "intern" in text.lower():
        strengths.append("Relevant internship keywords")

    if "github" not in text.lower() and "github.com" not in text.lower():
        weaknesses.append("No GitHub/project links")
    if "achieve" not in text.lower() and "%" not in text:
        weaknesses.append("No measurable achievements")
    if len(text.splitlines()) > 0 and len(text.splitlines()[0].split()) < 6:
        weaknesses.append("Weak summary section")

    improvement_tips = [
        "Add numbers like \"improved accuracy by 20%\".",
        "Add GitHub and LinkedIn links.",
        "Use stronger action words.",
        "Add project tech stack clearly."
    ]

    feature_metadata = build_resume_metadata(
        text=text,
        skills=skills,
        ats_score=ats_score,
        word_count=word_count,
        recommendations=recommendations or improvement_tips,
        questions=questions,
    )

    # UI / product metadata for front-end
    ui_meta = {
        "homepage_title": "AI Resume Analyzer Smart ATS scoring, skill extraction, and interview preparation in one dashboard.",
        "dashboard_layout": {
            "top": "ATS Score Card | Skills Found | Missing Keywords | Suggested Role",
            "middle": "Resume Match Progress | Extracted Skills | Missing Skills",
            "bottom": "Strengths | Weaknesses | Interview Questions | Improvement Tips"
        },
        "github_features": [
            "Resume upload",
            "Live analysis dashboard",
            "Animated ATS score ring",
            "Skill match cards",
            "Missing keyword detector",
            "Job role prediction",
            "Resume strength/weakness report",
            "Interview question generator",
            "Download analysis report as PDF",
            "Resume history page",
            "Dark/light mode"
        ],
        "visuals": {
            "ats_ring_value": ats_score,
            "score_badge": f"{ats_score}/100",
            "progress_bar": int(ats_score)
        }
    }

    response = {
        "success": True,
        "sections": {
            "1_ats_score": {
                "score": ats_score,
                "badge": ui_meta["visuals"]["score_badge"],
                "match_level": match_level,
                "display": "card",
                "description": "Calculated ATS score with visual badge and animated ring on the dashboard."
            },
            "2_resume_match_level": match_level,
            "3_extracted_skills": skills,
            "4_missing_skills": missing_skills,
            "5_resume_strengths": strengths or ["Solid keywords detected"],
            "6_resume_weaknesses": weaknesses or ["Consider improving summary and achievements section."],
            "7_job_role_suggestions": suggested_roles,
            "8_interview_questions": questions,
            "9_improvement_tips": improvement_tips
        },
        "summary": {
            "skill_count": len(skills),
            "word_count": word_count,
            "char_count": char_count,
            "recommendations": recommendations,
            "resume_preview": text[:900]
        },
        "metadata": feature_metadata,
        "ui": ui_meta
    }

    return jsonify(response)


@resume_bp.route("/job-match", methods=["POST"])
def job_match():
    payload = request.get_json(silent=True) or {}
    resume_skills = payload.get("resume_skills") or []
    job_description = payload.get("job_description", "")

    if not resume_skills:
        return jsonify({"error": "Resume skills required."}), 400

    if not job_description.strip():
        return jsonify({"error": "Job description required."}), 400

    job_skills = extract_skills(job_description)
    matched = [s for s in resume_skills if s in job_skills]
    missing = [s for s in job_skills if s not in resume_skills]
    score = int(len(matched) / len(job_skills) * 100) if job_skills else 0

    return jsonify({
        "success": True,
        "matched_skills": matched,
        "missing_skills": missing,
        "match_score": score,
        "total_job_skills": len(job_skills),
        "recommendation": "Great alignment!" if not missing else f"Add {len(missing)} missing skills."
    })
