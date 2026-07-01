import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const UPLOAD_LIMIT = 25;

const JOB_READINESS_STEPS = [
  {
    title: "Target the right role",
    detail: "Pick one role family, collect 5 job descriptions, and tune your resume around the skills that repeat.",
    action: "Build a focused keyword list"
  },
  {
    title: "Prove the skills",
    detail: "Turn projects into proof: problem, tools, your contribution, measurable result, and a live or GitHub link.",
    action: "Rewrite 2 project bullets"
  },
  {
    title: "Apply with intent",
    detail: "Send fewer generic applications. Customize the top third of the resume for each role and track every follow-up.",
    action: "Create a weekly application board"
  },
  {
    title: "Prepare the interview loop",
    detail: "Practice a short intro, one deep project story, common technical questions, and one question for the interviewer.",
    action: "Record a 3-minute mock answer"
  }
];

// Mock users database - This is no longer used for auth, but may be used for other UI elements.
const MOCK_USERS = [
  { id: 1, username: "admin", email: "admin@example.com", role: "admin", status: "active", focus: "Platform roles", joined: "2024-01-15" },
  { id: 2, username: "manager", email: "manager@example.com", role: "admin", status: "active", focus: "Hiring ops", joined: "2024-01-20" },
  { id: 3, username: "user", email: "user@example.com", role: "user", status: "active", focus: "Frontend roles", joined: "2024-02-10" },
  { id: 4, username: "john.doe", email: "john.doe@example.com", role: "user", status: "active", focus: "Backend roles", joined: "2024-03-01" },
  { id: 5, username: "jane.smith", email: "jane.smith@example.com", role: "user", status: "inactive", focus: "Data roles", joined: "2024-02-15" },
];

function PieChart({ score }) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <svg viewBox="0 0 120 120" className="pieChart" aria-label="ATS score chart">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--surface-2)" strokeWidth="16" />
      <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--primary)" strokeWidth="16" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 60 60)" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" className="pieLabel">{score}%</text>
    </svg>
  );
}

function App() {
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authMode, setAuthMode] = useState(null); // 'login' or 'register'
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [uploadHistory, setUploadHistory] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadCount, setUploadCount] = useState(0);
  const [adminTab, setAdminTab] = useState("users");
  const [settingsTab, setSettingsTab] = useState("profile");
  const [usersList, setUsersList] = useState(MOCK_USERS);

  useEffect(() => {
    const saved = localStorage.getItem("resumeAppState");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setUser(state.user);
        setIsAdmin(state.isAdmin);
        setUploadHistory(state.uploadHistory || []);
        setUploadCount(state.uploadCount || 0);
      } catch (e) {
        console.log("Failed to restore state", e);
      }
    }
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("resumeAppState", JSON.stringify({
        user,
        isAdmin,
        uploadHistory,
        uploadCount,
      }));
    } else {
      localStorage.removeItem("resumeAppState");
    }
  }, [user, isAdmin, uploadHistory, uploadCount]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/api/auth/login", { username, password });
      setUser({
        username: response.data.username,
        email: response.data.email, // Backend now sends email
        role: response.data.role,
        loginTime: new Date().toLocaleString()
      });
      setIsAdmin(response.data.role === "admin");
      setAuthMode(null); // Close auth modal
      setUsername("");
      setPassword("");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
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
      const response = await axios.post("http://127.0.0.1:5000/api/auth/register", { username, password });
      setError("");
      alert(response.data.message + " You can now log in.");
      setAuthMode('login'); // Switch to login after successful registration
      setPassword(""); // Clear password field
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Try a different username.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setResult(null);
    setFile(null);
    setActiveSection("dashboard");
    setError(""); // Clear any errors
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
    if (!user) { // Prevent upload if not logged in
      setError("Please login to upload resumes.");
      return;
    }

    if (uploadCount >= UPLOAD_LIMIT) {
      setError("You reached today's analysis limit. Review your latest report and try again later.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await axios.post("http://127.0.0.1:5000/api/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;
      const normalizedResult = {
        ats_score: data.sections?.["1_ats_score"]?.score ?? data.ats_score ?? 0,
        skills: data.sections?.["3_extracted_skills"] ?? data.skills ?? [],
        skill_count: data.summary?.skill_count ?? data.skill_count ?? 0,
        word_count: data.summary?.word_count ?? data.word_count ?? 0,
        char_count: data.summary?.char_count ?? data.char_count ?? 0,
        recommendations: data.summary?.recommendations ?? data.recommendations ?? [],
        resume_preview: data.summary?.resume_preview ?? data.resume_preview ?? "",
        questions: data.sections?.["8_interview_questions"] ?? data.questions ?? [],
        missing_skills: data.sections?.["4_missing_skills"] ?? [],
        strengths: data.sections?.["5_resume_strengths"] ?? [],
        weaknesses: data.sections?.["6_resume_weaknesses"] ?? [],
        suggested_roles: data.sections?.["7_job_role_suggestions"] ?? [],
        raw: data,
      };

      setResult(normalizedResult);
      setUploadCount((count) => count + 1);
      setUploadHistory((prev) => [
        {
          id: Date.now(),
          name: file.name,
          ats: normalizedResult.ats_score,
          skills: normalizedResult.skills,
          date: new Date().toLocaleString(),
        },
        ...prev,
      ].slice(0, 10));
      setActiveSection("dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const removeUser = (id) => {
    setUsersList(usersList.filter(u => u.id !== id));
  };

  const updateUserRole = (id, newRole) => {
    setUsersList(usersList.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  return (
    <div className="appShell">
      <header className="topBar">
        <div className="brandArea">
          <div className="logoBadge">🚀 AI Resume Studio</div>
          <div>
            <h1>Resume Analyzer</h1>
            <p>Smart ATS insights and job matching</p>
          </div>
        </div>
        <div className="topActions">
          <button className="ghostButton" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            {theme === "light" ? "🌙" : "☀️"}
          </button>
          {user ? (
            <>
              <span className="userInfo">Hi, {user.username}</span>
              <button className="ghostButton" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <button className="ghostButton" onClick={() => setAuthMode('login')}>Login</button>
              <button className="primaryButton" onClick={() => setAuthMode('register')}>Sign Up</button>
            </>
          )}
        </div>
      </header>

      <nav className="navBar">
        <button className={activeSection === "dashboard" ? "navItem active" : "navItem"} onClick={() => setActiveSection("dashboard")}>
          📊 Dashboard
        </button>
        <button className={activeSection === "uploads" ? "navItem active" : "navItem"} onClick={() => setActiveSection("uploads")}>
          📁 Uploads
        </button>
        {user && (
          <button className={activeSection === "settings" ? "navItem active" : "navItem"} onClick={() => setActiveSection("settings")}>
            ⚙️ Settings
          </button>
        )}
        {isAdmin && (
          <button className={activeSection === "admin" ? "navItem active" : "navItem"} onClick={() => setActiveSection("admin")}>
            👑 Admin
          </button>
        )}
        <button className={activeSection === "career" ? "navItem active" : "navItem"} onClick={() => setActiveSection("career")}>
          Get Hired
        </button>
        <button className={activeSection === "help" ? "navItem active" : "navItem"} onClick={() => setActiveSection("help")}>
          ❓ Help
        </button>
      </nav>

      {authMode && (
        <div className="modalBackdrop" onClick={() => setAuthMode(null)}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            {authMode === 'login' ? (
              <>
                <h2>Sign in to your account</h2>
                <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Username" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
                {error && <div className="alertBox alertError">{error}</div>}
                <div className="modalButtons">
                  <button className="primaryButton" onClick={handleLogin} disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
                  <button className="secondaryButton" onClick={() => setAuthMode(null)}>Cancel</button>
                </div>
                <div className="loginHint">
                  <small>Don't have an account? <button type="button" className="linkButton" onClick={() => { setAuthMode('register'); setError(""); }}>Sign Up</button></small>
                </div>
              </>
            ) : (
              <>
                <h2>Create an account</h2>
                <input value={username} onChange={(e) => setUsername(e.target.value)} type="text" placeholder="Choose a username" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Choose a password (min 8 characters)" />
                {error && <div className="alertBox alertError">{error}</div>}
                <div className="modalButtons">
                  <button className="primaryButton" onClick={handleRegister} disabled={loading}>{loading ? "Registering..." : "Register"}</button>
                  <button className="secondaryButton" onClick={() => setAuthMode(null)}>Cancel</button>
                </div>
                <div className="loginHint">
                  <small>Already have an account? <button type="button" className="linkButton" onClick={() => { setAuthMode('login'); setError(""); }}>Login</button></small>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <main className="mainGrid">
        <aside className="sidePanel">
          {user && (
            <>
              <div className="panel userProfileCard">
                <div className="username">👤 {user.username}</div>
                <div className="metadata">{user.role === "admin" ? "Admin User" : "Standard User"}</div>
                <div className="metadata">Focus: <strong>Job-ready resume</strong></div>
              </div>

              <div className="panel cardPanel">
                <h3>Account Stats</h3>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>Resume checks</span>
                  <strong>{uploadCount}/{UPLOAD_LIMIT}</strong>
                </div>
                <button className="primaryButton" onClick={() => setActiveSection("career")} style={{ marginTop: "8px" }}>Open career path</button>
              </div>
            </>
          )}

          {!user && (
            <div className="panel heroCard" style={{ background: "linear-gradient(135deg, #2563eb, #f59e0b)" }}>
              <h3 style={{ margin: "0 0 8px 0" }}>Get Started</h3>
              <p style={{ margin: "0 0 14px 0", fontSize: "0.9rem" }}>Sign in or register to analyze your resume and match with jobs.</p>
              <button className="primaryButton" onClick={() => setAuthMode('login')} style={{ background: "white", color: "#2563eb", fontWeight: "600" }}>
                Login Now
              </button>
            </div>
          )}

          <div className="panel cardPanel">
            <h3>Recent Uploads</h3>
            {uploadHistory.length ? (
              <ul className="historyList" style={{ fontSize: "0.9rem" }}>
                {uploadHistory.slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <strong style={{ fontSize: "0.9rem" }}>{item.name}</strong>
                    <small>🎯 {item.ats}% • 🏷️ {item.skills.length}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="quietText">No uploads yet.</p>
            )}
          </div>
        </aside>

        <section className="contentArea">
          {activeSection === "dashboard" && (
            <>
              <div className="panel heroCard">
                <h2>📈 Resume Analysis Dashboard</h2>
                <p>Upload a PDF, get instant ATS score, skill insights, and job matching.</p>
              </div>

              {!user && (
                <div className="alertBox alertInfo">
                  <strong>🔑 Login to upload resumes.</strong> Sign in with your email to start analyzing.
                </div>
              )}

              {user && (
                <>
                  <div className="panel uploadPanel">
                    <h3>📤 Upload Resume (PDF)</h3>
                    <input type="file" accept=".pdf" onChange={handleFileChange} />
                    <div className="actionRow">
                      <button className="primaryButton" onClick={uploadResume} disabled={loading}>{loading ? "Analyzing..." : "Analyze Resume"}</button>
                      <button className="secondaryButton" onClick={() => { setFile(null); setError(""); }}>Clear</button>
                    </div>
                    {error && <div className="alertBox alertError">{error}</div>}
                  </div>

                  {result && (
                    <>
                      <div className="statsGrid">
                        <div className="statCard">
                          <div className="label">ATS Score</div>
                          <div className="value">{result.ats_score}%</div>
                        </div>
                        <div className="statCard">
                          <div className="label">Skills Found</div>
                          <div className="value">{result.skill_count}</div>
                        </div>
                        <div className="statCard">
                          <div className="label">Word Count</div>
                          <div className="value">{result.word_count}</div>
                        </div>
                        <div className="statCard">
                          <div className="label">Character Count</div>
                          <div className="value">{result.char_count}</div>
                        </div>
                      </div>

                      <div className="resultGrid">
                        <div className="panel resultsCard">
                          <h3>🎯 ATS Score</h3>
                          <div style={{ textAlign: "center" }}>
                            <PieChart score={result.ats_score} />
                          </div>
                        </div>

                        <div className="panel resultsCard">
                          <h3>💡 Key Recommendations</h3>
                          {result.recommendations?.length ? (
                            <ul className="bulletList">
                              {result.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="quietText">✅ Strong resume structure detected.</p>
                          )}
                        </div>
                      </div>

                      <div className="panel panelTall">
                        <h3>🏷️ Detected Skills</h3>
                        <div className="skillChipRow">
                          {result.skills.map((skill) => (
                            <span key={skill} className="chip">⭐ {skill}</span>
                          ))}
                        </div>
                      </div>

                      <div className="panel panelTall">
                        <h3>📝 Resume Preview</h3>
                        <pre className="previewText">{result.resume_preview}</pre>
                      </div>

                      <div className="panel panelTall">
                        <h3>🎓 Interview Prep (Top 3)</h3>
                        <ul className="bulletList">
                          {result.questions?.slice(0, 3).map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="panel panelTall">
                        <h3>🔍 Job Match Search</h3>
                        <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste job description here..." rows={6} />
                        <button className="primaryButton" onClick={() => {
                          if (!jobDescription.trim()) {
                            setError("Paste a job description.");
                            return;
                          }
                          setActiveSection("dashboard");
                        }}>
                          🔎 Compare with Job
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {activeSection === "uploads" && user && (
            <div className="panel panelTall">
              <h2>📁 Upload History</h2>
              {uploadHistory.length ? (
                <table className="historyTable">
                  <thead>
                    <tr>
                      <th>📄 File Name</th>
                      <th>📅 Date</th>
                      <th>🎯 ATS Score</th>
                      <th>🏷️ Skills</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadHistory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.date}</td>
                        <td><strong>{item.ats}%</strong></td>
                        <td>{item.skills.slice(0, 3).join(", ")}{item.skills.length > 3 ? "..." : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="quietText">No upload history.</p>
              )}
            </div>
          )}

          {activeSection === "settings" && user && (
            <div className="panel">
              <h2>⚙️ Settings & Profile</h2>
              <div className="tabs">
                <button className={`tabButton ${settingsTab === "profile" ? "active" : ""}`} onClick={() => setSettingsTab("profile")}>👤 Profile</button>
                <button className={`tabButton ${settingsTab === "preferences" ? "active" : ""}`} onClick={() => setSettingsTab("preferences")}>🎨 Preferences</button>
                <button className={`tabButton ${settingsTab === "security" ? "active" : ""}`} onClick={() => setSettingsTab("security")}>🔐 Security</button>
              </div>

              {settingsTab === "profile" && (
                <div className="settingsGroup">
                  <h3>👤 Profile Information</h3>
                  <div className="settingRow">
                    <label>Email Address</label>
                    <strong>{user.email}</strong>
                  </div>
                  <div className="settingRow">
                    <label>Account Type</label>
                    <strong>{isAdmin ? "Admin" : "Standard"}</strong>
                  </div>
                  <div className="settingRow">
                    <label>Readiness Track</label>
                    <strong>Resume to interview</strong>
                  </div>
                  <div className="settingRow">
                    <label>Member Since</label>
                    <strong>2024</strong>
                  </div>
                  <button className="primaryButton" style={{ marginTop: "16px" }}>Edit Profile</button>
                </div>
              )}

              {settingsTab === "preferences" && (
                <div className="settingsGroup">
                  <h3>🎨 Preferences</h3>
                  <div className="settingRow">
                    <label>Dark Theme</label>
                    <button className={`toggle ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}></button>
                  </div>
                  <div className="settingRow">
                    <label>Email Notifications</label>
                    <button className="toggle active"></button>
                  </div>
                  <div className="settingRow">
                    <label>Show Analytics</label>
                    <button className="toggle active"></button>
                  </div>
                </div>
              )}

              {settingsTab === "security" && (
                <div className="settingsGroup">
                  <h3>🔐 Security</h3>
                  <div className="settingRow">
                    <label>Two-Factor Authentication</label>
                    <button className="secondaryButton">Enable</button>
                  </div>
                  <div className="settingRow">
                    <label>Connected Apps</label>
                    <button className="secondaryButton">Manage</button>
                  </div>
                  <div style={{ marginTop: "20px" }}>
                    <button className="dangerButton">Change Password</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === "admin" && isAdmin && (
            <div className="panel">
              <h2>👑 Admin Dashboard</h2>
              
              <div className="statsGrid">
                <div className="statCard">
                  <div className="label">Total Users</div>
                  <div className="value">{usersList.length}</div>
                </div>
                <div className="statCard">
                  <div className="label">Active Users</div>
                  <div className="value">{usersList.filter(u => u.status === "active").length}</div>
                </div>
                <div className="statCard">
                  <div className="label">Total Uploads</div>
                  <div className="value">{uploadHistory.length}</div>
                </div>
                <div className="statCard">
                  <div className="label">Avg Readiness</div>
                  <div className="value">82%</div>
                </div>
              </div>

              <div className="tabs" style={{ marginTop: "20px" }}>
                <button className={`tabButton ${adminTab === "users" ? "active" : ""}`} onClick={() => setAdminTab("users")}>👥 User Management</button>
                <button className={`tabButton ${adminTab === "analytics" ? "active" : ""}`} onClick={() => setAdminTab("analytics")}>📊 Analytics</button>
                <button className={`tabButton ${adminTab === "settings" ? "active" : ""}`} onClick={() => setAdminTab("settings")}>⚙️ System Settings</button>
              </div>

              {adminTab === "users" && (
                <>
                  <h3 style={{ marginTop: "20px" }}>👥 User Management</h3>
                  <table className="userTable">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Focus</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u.id}>
                          <td>{u.email}</td>
                          <td>
                            <select value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value)} style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border)" }}>
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td><span className="badge">{u.focus}</span></td>
                          <td><span className={`badge ${u.status === "active" ? "success" : "danger"}`}>{u.status}</span></td>
                          <td>{u.joined}</td>
                          <td>
                            <button className="dangerButton" onClick={() => removeUser(u.id)} style={{ padding: "4px 12px", fontSize: "0.85rem" }}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {adminTab === "analytics" && (
                <>
                  <h3 style={{ marginTop: "20px" }}>📊 Analytics & Reports</h3>
                  <div className="alertBox alertInfo" style={{ marginTop: "16px" }}>
                    📈 User engagement increased by 23% this month.
                  </div>
                  <div style={{ marginTop: "16px" }}>
                    <p>📊 Top Features: Resume Upload (85%), ATS Analysis (78%), Job Matching (62%)</p>
                    <p>⏰ Peak Usage: 2-4 PM on weekdays</p>
                    <p>Tracked outcomes: 34 interviews booked from targeted applications</p>
                  </div>
                </>
              )}

              {adminTab === "settings" && (
                <>
                  <h3 style={{ marginTop: "20px" }}>⚙️ System Settings</h3>
                  <div className="settingsGroup">
                    <div className="settingRow">
                      <label>Maintenance Mode</label>
                      <button className="toggle"></button>
                    </div>
                    <div className="settingRow">
                      <label>Enable GitHub Integration</label>
                      <button className="toggle active"></button>
                    </div>
                    <div className="settingRow">
                      <label>Backup Database</label>
                      <button className="primaryButton">Backup Now</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === "career" && (
            <>
              <div className="panel heroCard careerHero">
                <h2>Get job-ready without guessing</h2>
                <p>Use the analyzer as a weekly loop: target roles, improve proof, apply intentionally, and rehearse interviews.</p>
              </div>
              <div className="roadmapGrid">
                {JOB_READINESS_STEPS.map((step, index) => (
                  <div key={step.title} className="panel roadmapCard">
                    <span className="stepNumber">{index + 1}</span>
                    <h3>{step.title}</h3>
                    <p>{step.detail}</p>
                    <strong>{step.action}</strong>
                  </div>
                ))}
              </div>
              <div className="panel">
                <h3>Weekly job-search rhythm</h3>
                <div className="rhythmGrid">
                  <div><strong>Monday</strong><span>Analyze resume against 2 target roles.</span></div>
                  <div><strong>Tuesday</strong><span>Improve bullets and project proof.</span></div>
                  <div><strong>Wednesday</strong><span>Apply to 5 matched roles with tailored summaries.</span></div>
                  <div><strong>Thursday</strong><span>Message recruiters or alumni with a short proof pitch.</span></div>
                  <div><strong>Friday</strong><span>Practice interviews from your detected skills.</span></div>
                </div>
              </div>
            </>
          )}

          {activeSection === "help" && (
            <div className="panel">
              <h2>❓ Help & Support</h2>
              <h3 style={{ marginTop: "24px" }}>🚀 Getting Started</h3>
              <ol className="bulletList">
                <li>Create an account with your email.</li>
                <li>Upload a PDF resume.</li>
                <li>View your ATS score and skill analysis.</li>
                <li>Paste a job description to compare.</li>
              </ol>

              <h3 style={{ marginTop: "24px" }}>❓ FAQ</h3>
              <div className="faqItem">
                <strong>What is an ATS score?</strong>
                <p>ATS (Applicant Tracking System) score rates how well your resume matches common recruiter keywords. Higher scores improve chances of passing resume screening.</p>
              </div>
              <div className="faqItem">
                <strong>How should I use this to get a job?</strong>
                <p>Start with one target role, analyze your resume, fix missing keywords, then apply with project proof that matches the job description.</p>
              </div>
              <div className="faqItem">
                <strong>Can I export my results?</strong>
                <p>Use the resume preview, ATS score, skill analysis, recommendations, and job match insights as a checklist before applying.</p>
              </div>
              <div className="faqItem">
                <strong>How does job matching work?</strong>
                <p>Paste a job description, and our system compares your resume skills with the job requirements, showing matches and gaps.</p>
              </div>

              <h3 style={{ marginTop: "24px" }}>📞 Contact & Support</h3>
              <div className="contactBox">
                <p><strong>Email:</strong> <a href="mailto:support@resumestudio.com">support@resumestudio.com</a></p>
                <p><strong>Response Time:</strong> 24-48 hours</p>
                <p><strong>Support Hours:</strong> Mon-Fri, 9 AM - 6 PM EST</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
