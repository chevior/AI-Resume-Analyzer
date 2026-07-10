import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:5000";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", mark: "D" },
  { id: "interviews", label: "Mock Interviews", mark: "M" },
  { id: "analyzer", label: "Resume Analyzer", mark: "A" },
  { id: "jobs", label: "Jobs", mark: "J" },
  { id: "progress", label: "Progress", mark: "P" },
  { id: "action-plan", label: "Action Plan", mark: "N" },
  { id: "application-kit", label: "Application Kit", mark: "K" },
  { id: "questions", label: "Questions", mark: "Q" },
  { id: "insights", label: "Insight", mark: "I" },
];

const FALLBACK_JOBS = [
  { role: "Frontend Developer", company: "Interface Labs", match: 88, skills: ["React", "JavaScript", "REST API"], matched_skills: ["react"], missing_skills: ["typescript"] },
  { role: "Data Analyst", company: "MetricWorks", match: 76, skills: ["SQL", "Python", "Excel"], matched_skills: ["sql"], missing_skills: ["tableau"] },
  { role: "Full Stack Engineer", company: "CloudMint", match: 72, skills: ["Node.js", "React", "AWS"], matched_skills: ["react"], missing_skills: ["aws"] },
];

function ScoreRing({ score = 0 }) {
  const normalized = Math.max(0, Math.min(100, Number(score) || 0));
  return (
    <div className="scoreRing" style={{ "--score": `${normalized * 3.6}deg` }}>
      <div className="scoreInner">
        <strong>{normalized}%</strong>
        <span>ATS Score</span>
      </div>
    </div>
  );
}

function StepPill({ number, label }) {
  return (
    <span className="stepPill">
      <strong>{number}</strong>
      {label}
    </span>
  );
}

function uniqueItems(items, limit = 8) {
  const seen = new Set();
  return (items || [])
    .map((item) => String(item || "").trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function App() {
  const [theme, setTheme] = useState("light");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [authMode, setAuthMode] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [jobMatch, setJobMatch] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  const [uploadCount, setUploadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("resumeAppState");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setUser(state.user);
        setIsAdmin(state.isAdmin);
        setUploadHistory(state.uploadHistory || []);
        setUploadCount(state.uploadCount || 0);
        setResult(state.result || null);
      } catch (e) {
        console.log("Failed to restore state", e);
      }
    }
    setTheme(localStorage.getItem("theme") || "light");
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("resumeAppState", JSON.stringify({ user, isAdmin, uploadHistory, uploadCount, result }));
    } else {
      localStorage.removeItem("resumeAppState");
    }
  }, [user, isAdmin, uploadHistory, uploadCount, result]);

  useEffect(() => {
    const completeGitHubLogin = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (window.location.pathname !== "/auth/github/callback" || !code) return;

      setLoading(true);
      try {
        const response = await axios.post(`${API_BASE_URL}/api/github/callback`, { code });
        setUser({
          username: response.data.username,
          display_name: response.data.display_name,
          initials: response.data.initials,
          email: response.data.email,
          role: response.data.role,
          githubUsername: response.data.github_username,
          subscription: response.data.subscription,
          profile_verified: response.data.profile_verified,
          verified_by: response.data.verified_by,
        });
        setIsAdmin(response.data.role === "admin");
        setAuthMode(null);
        setError("");
        window.history.replaceState({}, document.title, "/");
      } catch (err) {
        setAuthMode("login");
        setError(err.response?.data?.error || "GitHub login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    completeGitHubLogin();
  }, []);

  useEffect(() => {
    const verifySavedProfile = async () => {
      if (!user?.username || user.profile_verified) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/api/auth/profile/${encodeURIComponent(user.username)}`);
        setUser((current) => ({ ...current, ...response.data }));
        setIsAdmin(response.data.role === "admin");
      } catch (err) {
        setUser((current) => current ? { ...current, profile_verified: false } : current);
      }
    };

    verifySavedProfile();
  }, [user?.username, user?.profile_verified]);

  const currentScore = result?.ats_score ?? 78;
  const hasAnalysis = Boolean(result?.metadata);
  const extractedSkills = result?.skills?.length ? result.skills : ["JavaScript", "React", "Python", "SQL", "REST APIs", "Node.js"];
  const metadata = result?.metadata || {};
  const missingSkills = metadata.insights?.missing_high_value_keywords?.length
    ? metadata.insights.missing_high_value_keywords
    : result?.missing_skills?.length
      ? result.missing_skills
      : ["Docker", "Kubernetes", "CI/CD", "AWS"];
  const questions = metadata.mock_interview?.questions?.length ? metadata.mock_interview.questions : result?.questions?.length ? result.questions : [
    "Tell me about the strongest project on your resume.",
    "How did you use your top technical skill in a real project?",
    "What would you improve in your current resume for this role?",
  ];
  const jobs = metadata.jobs?.length ? metadata.jobs : FALLBACK_JOBS;
  const readiness = metadata.dashboard?.readiness || {
    score: currentScore,
    category: result ? "Resume scanned" : "Sample readiness",
    breakdown: [
      { key: "ats", label: "ATS readiness", score: currentScore, status: currentScore >= 75 ? "strong" : "improve" },
      { key: "skills", label: "Skill coverage", score: Math.min(100, extractedSkills.length * 12), status: extractedSkills.length >= 6 ? "strong" : "improve" },
      { key: "proof", label: "Proof links", score: result ? 45 : 70, status: "improve" },
      { key: "impact", label: "Measured impact", score: result ? 50 : 72, status: "improve" },
      { key: "targeting", label: "Role targeting", score: jobs[0]?.match || 70, status: "strong" },
    ],
  };
  const actionPlan = metadata.action_plan?.length ? metadata.action_plan : [
    { title: "Run the first resume scan", priority: "Start here", effort: "2 min", detail: "Upload a PDF so ResumeNova can extract skills, score ATS readiness, detect formatting issues, and replace demo content with your real profile." },
    { title: "Target one role clearly", priority: "High impact", effort: "5 min", detail: "Paste a job description after scanning to compare keywords, identify missing requirements, and tune your resume for one specific application." },
    { title: "Strengthen proof of work", priority: "Quality", effort: "15 min", detail: "Use the recommendations to add measurable outcomes, project links, stronger bullets, and clearer evidence for the roles you want." },
    { title: "Prepare interview stories", priority: "Practice", effort: "20 min", detail: "Convert resume projects into concise interview examples with situation, action, result, tradeoffs, and lessons learned." },
  ];
  const applicationKit = metadata.application_kit || {
    target_role: hasAnalysis ? jobs[0]?.role || "Target role" : "Application kit preview",
    pitch: hasAnalysis ? "Use your resume analysis to prepare role-specific application material." : "After a scan, this page becomes a professional packet for applications: recruiter pitch, cover-note bullets, checklist, and follow-up copy.",
    cover_note: [
      "Summarize your strongest technical skills in one concise opening line.",
      "Tie your best project or achievement to the role's most important requirement.",
      "Use job-match gaps to adjust language before sending the application.",
    ],
    checklist: [
      "Resume scan completed and highest-priority fixes reviewed.",
      "Target job description compared for keywords and missing requirements.",
      "Resume bullets updated with measurable outcomes and stronger proof.",
      "Report downloaded or saved before submitting the application.",
    ],
    follow_up: [
      "Send a short follow-up that references the role, one relevant project, and a clear reason you are a fit.",
      "Keep the message specific: avoid repeating your resume and point to one proof point the recruiter can verify quickly.",
    ],
  };
  const progressItems = metadata.progress?.items?.length ? metadata.progress.items : [
    { label: "ATS readiness", value: currentScore, unit: "%" },
    { label: "Skills detected", value: extractedSkills.length, unit: "" },
    { label: "Priority gaps", value: missingSkills.length, unit: "" },
    { label: "Best job fit", value: jobs[0]?.match || 0, unit: "%" },
  ];

  const formatChecks = useMemo(() => metadata.dashboard?.formatting_checks?.length ? metadata.dashboard.formatting_checks : [
    { label: "Clean, ATS-friendly format", status: currentScore > 55 ? "pass" : "warn" },
    { label: "Standard section headings used", status: currentScore > 65 ? "pass" : "warn" },
    { label: "Bullet points instead of paragraphs", status: currentScore > 72 ? "pass" : "warn" },
    { label: "Avoid tables or columns", status: currentScore > 82 ? "pass" : "warn" },
  ], [currentScore, metadata.dashboard]);

  const openUploadFlow = () => {
    if (!user) {
      setAuthMode("login");
      setError("Login first, then upload a resume to generate this feature.");
      return;
    }
    setActiveSection("dashboard");
    window.setTimeout(() => document.getElementById("resume-file")?.click(), 80);
  };

  const sectionGuidance = {
    interviews: [
      "A role-specific warmup round based on your strongest projects and technical skills.",
      "Behavioral prompts that connect your resume evidence to teamwork, ownership, and impact.",
      "Follow-up questions that challenge vague bullets and help you prepare stronger examples.",
      "A practice plan that separates quick answers, deep project stories, and weak areas to rehearse.",
    ],
    analyzer: [
      "ATS score breakdown with formatting, section structure, keyword density, and readability signals.",
      "Strengths and weaknesses grouped into recruiter-facing language, technical proof, and measurable impact.",
      "Rewrite suggestions for bullets that need stronger action verbs, numbers, or clearer outcomes.",
      "A quality checklist for headings, file structure, length, links, and ATS-safe formatting.",
    ],
    jobs: [
      "Ranked role matches based on detected skills, suggested titles, and missing high-value keywords.",
      "Skill-gap summaries that separate must-have requirements from nice-to-have improvements.",
      "Job comparison support for pasted descriptions so you can tailor one resume per target role.",
      "A shortlist of roles where your current resume is strongest and where it needs positioning work.",
    ],
    progress: [
      "A readiness timeline that tracks ATS score, detected skills, priority gaps, and job-match improvement.",
      "Before-and-after checkpoints for each resume scan so progress is visible instead of guessed.",
      "Next-step tracking for keyword coverage, proof links, quantified bullets, and interview preparation.",
      "A focused completion view that shows what is ready, what needs work, and what to do next.",
    ],
    questions: [
      "Technical questions generated from your actual tools, projects, and claimed experience.",
      "Recruiter screening prompts for background, availability, motivation, and role fit.",
      "Project deep-dive questions that help you explain decisions, tradeoffs, results, and ownership.",
      "Concise answer prompts so you can prepare responses without memorizing robotic scripts.",
    ],
    insights: [
      "Priority recommendations that identify the highest-impact changes before you apply.",
      "Missing keyword analysis connected to target roles instead of generic resume advice.",
      "Best-role-fit guidance that turns your extracted skills into a clearer positioning strategy.",
      "A summary of what to improve first across content, formatting, proof, and job targeting.",
    ],
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { username, password });
      setUser({
        username: response.data.username,
        display_name: response.data.display_name,
        initials: response.data.initials,
        email: response.data.email,
        role: response.data.role,
        subscription: response.data.subscription,
        profile_verified: response.data.profile_verified,
        verified_by: response.data.verified_by,
      });
      setIsAdmin(response.data.role === "admin");
      setAuthMode(null);
      setUsername("");
      setPassword("");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Try demo user: user / user123.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/register`, { username, password });
      setError("");
      setAuthMode("login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_BASE_URL}/api/github/login`);
      window.location.assign(response.data.auth_url);
    } catch (err) {
      setError(err.response?.data?.error || "GitHub login is unavailable right now.");
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files allowed.");
      return;
    }
    if (selectedFile.size > 6 * 1024 * 1024) {
      setError("File must be under 6MB.");
      return;
    }
    setError("");
    setFile(selectedFile);
  };

  const uploadResume = async () => {
    if (!file) {
      setError("Select a PDF resume.");
      return;
    }
    if (!user) {
      setError("Please login to upload resumes.");
      setAuthMode("login");
      return;
    }
    const formData = new FormData();
    formData.append("resume", file);
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/resume/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = response.data;
      const normalizedResult = {
        ats_score: data.sections?.["1_ats_score"]?.score ?? data.ats_score ?? 0,
        match_level: data.sections?.["2_resume_match_level"] ?? "Review Ready",
        skills: data.sections?.["3_extracted_skills"] ?? data.skills ?? [],
        missing_skills: data.sections?.["4_missing_skills"] ?? [],
        strengths: data.sections?.["5_resume_strengths"] ?? [],
        weaknesses: data.sections?.["6_resume_weaknesses"] ?? [],
        suggested_roles: data.sections?.["7_job_role_suggestions"] ?? [],
        questions: data.sections?.["8_interview_questions"] ?? [],
        improvement_tips: data.sections?.["9_improvement_tips"] ?? [],
        skill_count: data.summary?.skill_count ?? 0,
        word_count: data.summary?.word_count ?? 0,
        char_count: data.summary?.char_count ?? 0,
        recommendations: data.summary?.recommendations ?? [],
        resume_preview: data.summary?.resume_preview ?? "",
        metadata: data.metadata ?? {},
      };

      setResult(normalizedResult);
      setUploadCount((count) => count + 1);
      setUploadHistory((prev) => [
        { id: Date.now(), name: file.name, ats: normalizedResult.ats_score, skills: normalizedResult.skills, date: new Date().toLocaleString() },
        ...prev,
      ].slice(0, 10));
      setActiveSection("dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const compareJob = async () => {
    if (!result?.skills?.length) {
      setError("Analyze a resume before comparing jobs.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Paste a job description.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/resume/job-match`, {
        resume_skills: result.skills,
        job_description: jobDescription,
      });
      setJobMatch(response.data);
    } catch (err) {
      setError(err.response?.data?.error || "Job match failed.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const report = [
      "AI Resume Analyzer Report",
      `ATS Score: ${currentScore}%`,
      `Career Readiness: ${readiness.score}% - ${readiness.category}`,
      `Skills: ${extractedSkills.join(", ")}`,
      `Missing Keywords: ${missingSkills.join(", ")}`,
      `Best Role Fit: ${metadata.insights?.best_role?.role || jobs[0]?.role || "Not calculated"}`,
      "",
      "Action Plan:",
      ...actionPlan.map((action) => `${action.priority}: ${action.title} (${action.effort}) - ${action.detail}`),
      "",
      "Application Kit:",
      `Target Role: ${applicationKit.target_role}`,
      `Pitch: ${applicationKit.pitch}`,
      ...applicationKit.cover_note.map((item) => `Cover Note: ${item}`),
      "",
      "Recommendations:",
      ...(metadata.insights?.recommendations?.length ? metadata.insights.recommendations : result?.recommendations?.length ? result.recommendations : ["Add measurable results, targeted keywords, and links to proof of work."]),
      "",
      "Interview Questions:",
      ...questions,
    ].join("\n");
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "resume-analysis-report.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderDashboard = () => (
    <>
      <section className="dashboardHero">
        <div>
          <span className="eyebrow">Resume review</span>
          <h2>{result ? metadata.dashboard?.headline || `New CV: ${uploadHistory[0]?.name || "Resume.pdf"}` : "Professional resume analysis"}</h2>
          <p>{result ? metadata.dashboard?.summary || "Your resume has been analyzed." : "Upload a PDF to review score, keywords, and next steps."}</p>
          <div className="workflowRail">
            <StepPill number="1" label="Upload" />
            <StepPill number="2" label="Review" />
            <StepPill number="3" label="Apply" />
          </div>
        </div>
        <div className="heroActions">
          <button className="primaryButton" onClick={() => user ? document.getElementById("resume-file")?.click() : setAuthMode("login")}>
            {user ? "Upload resume" : "Sign in to start"}
          </button>
          <button className="secondaryButton" onClick={() => setActiveSection("action-plan")}>View plan</button>
        </div>
      </section>

      <section className="metricStrip">
        {progressItems.map((item) => (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}{item.unit}</strong>
          </div>
        ))}
      </section>

      <div className="dashboardGrid">
        <section className="card uploadCard">
          <span className="eyebrow">Step 1</span>
          <h3>Upload and analyze</h3>
          <input id="resume-file" className="hiddenFileInput" type="file" accept=".pdf" onChange={handleFileChange} />
          <label className="fileDropZone" htmlFor="resume-file">
            <strong>{file ? "Selected resume" : "Choose PDF resume"}</strong>
            <span>{file ? file.name : "PDF only, up to 6MB"}</span>
          </label>
          <div className="fileMeta">
            <span>{file ? file.name : "PDF up to 6MB"}</span>
            <strong>{uploadCount} scans</strong>
          </div>
          <button className="primaryButton fullButton" onClick={uploadResume} disabled={loading}>{loading ? "Analyzing..." : "Run analysis"}</button>
          {error && <div className="alertBox alertError">{error}</div>}
        </section>

        <section className="card scoreCard">
          <div className="cardTitle">
            <h3>ATS score</h3>
            <span>{result?.match_level || "Demo data"}</span>
          </div>
          <ScoreRing score={currentScore} />
          <h2>{result ? uploadHistory[0]?.name : "Resume.pdf"}</h2>
          <p>{result ? "Your resume has been analyzed." : "Upload your resume to replace the demo data."}</p>
          <div className="quickActions">
            <button className="secondaryButton" onClick={downloadReport}>Download report</button>
            <button className="secondaryButton" onClick={() => document.getElementById("resume-file")?.click()}>Upload resume</button>
          </div>
        </section>

        <section className="card keywordCard">
          <div className="cardTitle">
            <h3>Job keyword match</h3>
            <span>{jobMatch ? `${jobMatch.match_score}%` : `${metadata.dashboard?.keyword_match ?? Math.min(currentScore + 7, 96)}%`}</span>
          </div>
          <div className="matchBar"><span style={{ width: `${jobMatch?.match_score ?? metadata.dashboard?.keyword_match ?? Math.min(currentScore + 7, 96)}%` }} /></div>
          <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste a job description to compare..." />
          <button className="secondaryButton fullButton" onClick={compareJob} disabled={loading}>Compare job</button>
          {jobMatch && (
            <div className="jobMatchPanel">
              <strong>{jobMatch.fit_level}</strong>
              <p>{jobMatch.summary || jobMatch.recommendation}</p>
              <div className="matchColumns">
                <div>
                  <span>Matched</span>
                  <div className="chipCloud compact">{(jobMatch.matched_skills?.length ? jobMatch.matched_skills : ["None"]).map((skill) => <em key={skill}>{skill}</em>)}</div>
                </div>
                <div>
                  <span>Missing</span>
                  <div className="chipCloud compact missing">{(jobMatch.missing_skills?.length ? jobMatch.missing_skills : ["None"]).map((skill) => <em key={skill}>{skill}</em>)}</div>
                </div>
              </div>
              <ul>
                {(jobMatch.keyword_plan || []).slice(0, 3).map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
        </section>

        <section className="card feedbackCard">
          <h3>Formatting checks</h3>
          {formatChecks.map((check) => (
            <div className={`checkRow ${check.status}`} key={check.label}>
              <span>{check.status === "pass" ? "OK" : "FIX"}</span>
              <p>{check.label}</p>
            </div>
          ))}
        </section>

        <section className="card readinessCard">
          <div className="cardTitle">
            <h3>Career Readiness</h3>
            <span>{readiness.category}</span>
          </div>
          <div className="readinessScore">
            <strong>{readiness.score}%</strong>
            <p>{result ? "Weighted from ATS score, skills, proof, impact, and target-role fit." : "Demo readiness until you upload a resume."}</p>
          </div>
          <div className="readinessList">
            {readiness.breakdown.map((item) => (
              <div className="readinessRow" key={item.key}>
                <span>{item.label}</span>
                <div className="miniBar"><i style={{ width: `${item.score}%` }} /></div>
                <strong>{item.score}%</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="card actionCard">
          <div className="cardTitle">
            <h3>Next Best Actions</h3>
            <span>{actionPlan.length} tasks</span>
          </div>
          <div className="actionStack">
            {actionPlan.slice(0, 3).map((action) => (
              <button className="actionItem" key={action.title} onClick={() => setActiveSection("action-plan")}>
                <span>{action.priority}</span>
                <strong>{action.title}</strong>
                <small>{action.effort}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="card chipCard">
          <h3>Extracted Skills</h3>
          <div className="chipCloud">{extractedSkills.map((skill) => <span key={skill}>{skill}</span>)}</div>
        </section>

        <section className="card chipCard warningCard">
          <h3>Missing keywords</h3>
          <div className="chipCloud missing">{missingSkills.map((skill) => <span key={skill}>+ {skill}</span>)}</div>
        </section>
      </div>
    </>
  );

  const renderFeature = () => {
    if (activeSection === "interviews") {
      return (
        <FeaturePanel
          title="Mock Interviews"
          subtitle={hasAnalysis ? `${metadata.mock_interview?.difficulty || "Resume-based"} practice generated from your resume.` : "Prepare for recruiter screens, project deep-dives, and technical follow-ups with prompts tailored to your resume."}
          items={hasAnalysis ? questions : sectionGuidance.interviews}
          action={hasAnalysis ? "Open question bank" : "Upload resume"}
          onAction={hasAnalysis ? () => setActiveSection("questions") : openUploadFlow}
          status={hasAnalysis ? "Backend generated" : "Waiting for resume"}
        />
      );
    }
    if (activeSection === "analyzer") {
      return (
        <FeaturePanel
          title="Resume Analyzer"
          subtitle={hasAnalysis ? "Backend-calculated strengths, weaknesses, formatting, and improvement tips." : "Get a structured review of content quality, ATS readiness, formatting, skills, and proof of impact."}
          items={hasAnalysis ? uniqueItems([
            ...(metadata.resume_analyzer?.strengths || result?.strengths || []),
            ...(metadata.resume_analyzer?.weaknesses || result?.weaknesses || []),
            ...(metadata.resume_analyzer?.formatting_checks?.map((item) => `${item.status.toUpperCase()}: ${item.label}`) || []),
            ...(result?.improvement_tips || []),
          ], 7) : sectionGuidance.analyzer}
          action={hasAnalysis ? "Analyze new resume" : "Upload resume"}
          onAction={openUploadFlow}
          status={hasAnalysis ? `${result.word_count || 0} words analyzed` : "No resume analyzed"}
        />
      );
    }
    if (activeSection === "jobs") {
      return hasAnalysis ? (
        <div className="featureGrid">
          {jobs.map((job) => (
            <div className="card jobCard" key={job.role}>
              <span className="eyebrow">{job.company}</span>
              <h3>{job.role}</h3>
              <ScoreRing score={job.match} />
              <div className="chipCloud">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              <p>{job.recommendation || `${job.matched_skills?.length || 0} matched skills, ${job.missing_skills?.length || 0} gaps`}</p>
            </div>
          ))}
        </div>
      ) : (
        <FeaturePanel
          title="Jobs"
          subtitle="Use your resume data to identify realistic role matches, skill gaps, and better target positions."
          items={sectionGuidance.jobs}
          action="Upload resume"
          onAction={openUploadFlow}
          status="Waiting for resume"
        />
      );
    }
    if (activeSection === "progress") {
      return (
        <FeaturePanel
          title="Progress"
          subtitle={hasAnalysis ? "Track backend-calculated readiness, skill coverage, gaps, and next steps." : "Turn resume improvement into a trackable workflow with measurable readiness signals."}
          items={hasAnalysis ? uniqueItems([
            ...progressItems.map((item) => `${item.label}: ${item.value}${item.unit}`),
            ...(metadata.progress?.next_steps || []),
          ], 8) : sectionGuidance.progress}
          action={hasAnalysis ? "Download report" : "Upload resume"}
          onAction={hasAnalysis ? downloadReport : openUploadFlow}
          status={hasAnalysis ? "Live progress" : "No scan yet"}
        />
      );
    }
    if (activeSection === "action-plan") {
      return (
        <section className="featurePanel">
          <div className="featureHeader">
            <span className="eyebrow">{hasAnalysis ? readiness.category : "Waiting for resume"}</span>
            <h2>Action Plan</h2>
            <p>{hasAnalysis ? `Prioritized fixes based on a ${readiness.score}% career readiness score.` : "A practical improvement roadmap for resume quality, targeting, job comparison, and interview readiness."}</p>
            <button className="primaryButton" onClick={hasAnalysis ? downloadReport : openUploadFlow}>{hasAnalysis ? "Download report" : "Upload resume"}</button>
          </div>
          <div className="planBoard">
            {actionPlan.map((action, index) => (
              <article className="planItem" key={`${action.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div className="planMeta">
                    <strong>{action.priority}</strong>
                    <small>{action.effort}</small>
                  </div>
                  <h3>{action.title}</h3>
                  <p>{action.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }
    if (activeSection === "application-kit") {
      return (
        <section className="featurePanel">
          <div className="featureHeader">
            <span className="eyebrow">{applicationKit.target_role}</span>
            <h2>Application Kit</h2>
            <p>{applicationKit.pitch}</p>
            <button className="primaryButton" onClick={hasAnalysis ? downloadReport : openUploadFlow}>{hasAnalysis ? "Download kit" : "Upload resume"}</button>
          </div>
          <div className="kitGrid">
            <section className="kitPanel">
              <h3>Cover Note Bullets</h3>
              {applicationKit.cover_note.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}
            </section>
            <section className="kitPanel">
              <h3>Application Checklist</h3>
              {applicationKit.checklist.map((item, index) => (
                <div className="kitCheck" key={`${item}-${index}`}><span>{index + 1}</span>{item}</div>
              ))}
            </section>
            <section className="kitPanel kitWide">
              <h3>Follow Up</h3>
              {applicationKit.follow_up.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}
            </section>
          </div>
        </section>
      );
    }
    if (activeSection === "questions") {
      return (
        <FeaturePanel
          title="Questions"
          subtitle={hasAnalysis ? "Interview and recruiter-screening questions generated from your resume." : "Build a serious question bank for technical, behavioral, recruiter, and project-based interview practice."}
          items={hasAnalysis ? uniqueItems([
            ...questions,
            ...(metadata.questions?.screening || []),
          ], 8) : sectionGuidance.questions}
          action={hasAnalysis ? "Download report" : "Upload resume"}
          onAction={hasAnalysis ? downloadReport : openUploadFlow}
          status={hasAnalysis ? `${questions.length} interview prompts` : "Waiting for resume"}
        />
      );
    }
    if (activeSection === "insights") {
      return (
        <FeaturePanel
          title="Insight"
          subtitle={hasAnalysis ? "Backend-calculated recommendations, missing keywords, and best-role fit." : "See what your resume is communicating, what it is missing, and how to position it more clearly."}
          items={hasAnalysis ? uniqueItems(metadata.insights?.recommendations?.length ? metadata.insights.recommendations : result?.recommendations || [], 7) : sectionGuidance.insights}
          action={hasAnalysis ? "Compare job" : "Upload resume"}
          onAction={hasAnalysis ? () => setActiveSection("dashboard") : openUploadFlow}
          status={hasAnalysis ? metadata.insights?.best_role?.role || "Insight ready" : "Waiting for resume"}
        />
      );
    }
    return renderDashboard();
  };

  return (
    <div className="appFrame">
      <main className="workspace">
        <header className="appTopbar">
          <div className="topbarIdentity">
            <span className="brandMark" aria-hidden="true">R</span>
            <div>
              <span className="eyebrow">{user ? "Signed in workspace" : "Guest workspace"}</span>
              <h1>{NAV_ITEMS.find((item) => item.id === activeSection)?.label || "Dashboard"}</h1>
            </div>
          </div>
          <div className="topbarActions">
            <button className="secondaryButton" onClick={() => setActiveSection("application-kit")}>Application Kit</button>
            <button className="secondaryButton" onClick={downloadReport}>Download report</button>
            <button className="primaryButton" onClick={() => user ? document.getElementById("resume-file")?.click() : setAuthMode("login")}>Upload resume</button>
          </div>
        </header>

        <nav className="workspaceNav" aria-label="Workspace sections">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={activeSection === item.id ? "active" : ""} onClick={() => setActiveSection(item.id)}>
              {item.label}
            </button>
          ))}
        </nav>

        {activeSection === "dashboard" ? renderDashboard() : renderFeature()}
      </main>

      {authMode && (
        <div className="modalBackdrop" onClick={() => setAuthMode(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <h2>{authMode === "login" ? "Login" : "Create Account"}</h2>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
            {error && <div className="alertBox alertError">{error}</div>}
            <div className="modalButtons">
              <button className="primaryButton" onClick={authMode === "login" ? handleLogin : handleRegister} disabled={loading}>{loading ? "Please wait..." : authMode === "login" ? "Login" : "Register"}</button>
              <button className="secondaryButton" onClick={() => setAuthMode(null)}>Cancel</button>
            </div>
            <div className="authDivider"><span>or</span></div>
            <button className="githubButton" onClick={handleGitHubLogin} disabled={loading}>Continue with GitHub</button>
            <p className="loginHint">
              {authMode === "login" ? "Demo: user / user123" : "Use at least 8 characters for password."}
              <button className="linkButton" onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setError(""); }}>
                {authMode === "login" ? " Create account" : " Login instead"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturePanel({ title, subtitle, items, action, onAction, status }) {
  const safeItems = uniqueItems(items?.length ? items : ["Upload a resume to generate this feature."], 8);
  return (
    <section className="featurePanel">
      <div className="featureHeader">
        <span className="eyebrow">{status || "Feature workspace"}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <button className="primaryButton" onClick={onAction || (() => {})}>{action}</button>
      </div>
      <div className="featureList">
        {safeItems.map((item, index) => (
          <div className="featureItem" key={`${item}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default App;
