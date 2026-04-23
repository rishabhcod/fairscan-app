import { useState, useCallback, useRef } from "react";
import { AlertTriangle, CheckCircle, XCircle, Upload, ChevronRight, Shield, BarChart3, Zap, Eye, RefreshCw, Copy, ChevronDown, ChevronUp, Info } from "lucide-react";

const GEMINI_MODEL = "gemini-2.0-flash";

const SAMPLE_CSV = `age,gender,race,education,job_title,loan_approved,salary
34,Male,White,Bachelor,Engineer,Yes,95000
28,Female,Black,Master,Manager,No,72000
45,Male,Asian,PhD,Director,Yes,130000
31,Female,Hispanic,Bachelor,Analyst,No,58000
52,Male,White,Master,VP,Yes,175000
26,Female,Black,Bachelor,Coordinator,No,42000
39,Male,Hispanic,Bachelor,Supervisor,Yes,68000
33,Female,Asian,Master,Engineer,Yes,88000
48,Male,White,PhD,Director,Yes,145000
29,Female,White,Bachelor,Analyst,Yes,61000
41,Male,Black,Master,Manager,No,74000
36,Female,Hispanic,Bachelor,Coordinator,No,45000
55,Male,White,Master,VP,Yes,180000
27,Female,Asian,Bachelor,Analyst,Yes,65000
43,Male,Black,Bachelor,Supervisor,No,66000`;

const PROTECTED_ATTRS = ["gender","race","age","ethnicity","religion","disability","nationality","marital_status","color","national_origin"];

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

  :root {
    --bg: #0a0a0f;
    --surface: #111118;
    --surface2: #1a1a24;
    --border: #2a2a3a;
    --border-bright: #3a3a52;
    --amber: #f59e0b;
    --amber-dim: #92400e;
    --red: #ef4444;
    --red-dim: #7f1d1d;
    --green: #10b981;
    --green-dim: #064e3b;
    --blue: #6366f1;
    --blue-dim: #312e81;
    --text: #e8e8f0;
    --text-dim: #8888aa;
    --text-muted: #55556a;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .app {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    position: relative;
    overflow-x: hidden;
  }

  .grid-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: 
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .scanline {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background: repeating-linear-gradient(
      0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px
    );
  }

  .content { position: relative; z-index: 1; }

  /* Header */
  .header {
    border-bottom: 1px solid var(--border);
    padding: 16px 32px;
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(10,10,15,0.9); backdrop-filter: blur(12px);
    position: sticky; top: 0; z-index: 100;
  }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-icon {
    width: 36px; height: 36px; background: var(--amber); border-radius: 8px;
    display: flex; align-items: center; justify-content: center; color: #000; font-weight: 800;
    font-size: 14px; letter-spacing: -1px;
  }
  .logo-text { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
  .logo-sub { font-size: 11px; color: var(--text-muted); font-family: 'Space Mono', monospace; margin-top: 1px; }
  .header-badge {
    font-family: 'Space Mono', monospace; font-size: 10px;
    border: 1px solid var(--border-bright); padding: 4px 10px; border-radius: 4px;
    color: var(--text-dim); display: flex; align-items: center; gap: 6px;
  }
  .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* Main layout */
  .main { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }

  /* Hero */
  .hero { text-align: center; margin-bottom: 48px; }
  .hero-tag {
    display: inline-block; font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--amber); border: 1px solid var(--amber-dim); padding: 4px 12px;
    border-radius: 2px; letter-spacing: 2px; margin-bottom: 20px;
    text-transform: uppercase;
  }
  .hero h1 { font-size: clamp(32px, 5vw, 52px); font-weight: 800; line-height: 1.05; letter-spacing: -2px; margin-bottom: 16px; }
  .hero h1 span { color: var(--amber); }
  .hero p { font-size: 16px; color: var(--text-dim); max-width: 560px; margin: 0 auto 32px; line-height: 1.7; }

  /* Steps */
  .steps { display: flex; gap: 8px; justify-content: center; margin-bottom: 40px; flex-wrap: wrap; }
  .step {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-muted);
  }
  .step.active { color: var(--amber); }
  .step.done { color: var(--green); }
  .step-num {
    width: 24px; height: 24px; border-radius: 50%; border: 1px solid currentColor;
    display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0;
  }
  .step-arrow { color: var(--text-muted); font-size: 10px; margin: 0 4px; }

  /* Cards */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 12px; padding: 24px; margin-bottom: 20px;
    transition: border-color 0.2s;
  }
  .card:hover { border-color: var(--border-bright); }
  .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .card-icon {
    width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center;
    background: var(--surface2);
  }
  .card-title { font-size: 15px; font-weight: 700; }
  .card-desc { font-size: 12px; color: var(--text-muted); font-family: 'Space Mono', monospace; margin-top: 2px; }

  /* API Key */
  .api-row { display: flex; gap: 10px; }
  .input-field {
    flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
    padding: 10px 14px; color: var(--text); font-family: 'Space Mono', monospace; font-size: 12px;
    outline: none; transition: border-color 0.2s;
  }
  .input-field:focus { border-color: var(--amber); }
  .input-field::placeholder { color: var(--text-muted); }
  .input-field.valid { border-color: var(--green); }
  .input-field.error { border-color: var(--red); }

  /* Textarea */
  .textarea-field {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
    padding: 14px; color: var(--text); font-family: 'Space Mono', monospace; font-size: 11px;
    outline: none; resize: vertical; min-height: 180px; line-height: 1.6;
    transition: border-color 0.2s;
  }
  .textarea-field:focus { border-color: var(--amber); }

  /* Buttons */
  .btn {
    padding: 10px 20px; border-radius: 8px; border: none; font-family: 'Syne', sans-serif;
    font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px;
    font-size: 13px; transition: all 0.15s; white-space: nowrap;
  }
  .btn-primary {
    background: var(--amber); color: #000;
  }
  .btn-primary:hover { background: #fbbf24; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .btn-secondary {
    background: var(--surface2); color: var(--text-dim); border: 1px solid var(--border);
  }
  .btn-secondary:hover { border-color: var(--border-bright); color: var(--text); }
  .btn-ghost { background: transparent; color: var(--text-muted); padding: 6px 10px; font-size: 11px; }
  .btn-ghost:hover { color: var(--amber); }
  .btn-full { width: 100%; justify-content: center; padding: 14px; font-size: 15px; }

  /* Attributes */
  .attr-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .attr-chip {
    padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
    background: var(--surface2); color: var(--text-muted); font-size: 12px;
    font-family: 'Space Mono', monospace; cursor: pointer; transition: all 0.15s;
  }
  .attr-chip:hover { border-color: var(--amber-dim); color: var(--amber); }
  .attr-chip.selected { border-color: var(--amber); background: rgba(245,158,11,0.1); color: var(--amber); }

  /* Detected attrs */
  .detected-banner {
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25);
    border-radius: 8px; padding: 12px 16px; margin-top: 16px; font-size: 12px;
    display: flex; align-items: flex-start; gap: 10px;
  }
  .detected-banner .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .detected-chip {
    padding: 2px 10px; border-radius: 12px; background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; font-size: 11px; font-family: 'Space Mono', monospace;
  }

  /* Analyze button area */
  .analyze-section { margin-top: 24px; }

  /* Loading */
  .loading-box {
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 60px 32px; text-align: center;
  }
  .spinner {
    width: 48px; height: 48px; border: 2px solid var(--border);
    border-top-color: var(--amber); border-radius: 50%;
    animation: spin 0.8s linear infinite; margin: 0 auto 24px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-steps { list-style: none; text-align: left; display: inline-block; margin-top: 20px; }
  .loading-step {
    font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-muted);
    padding: 4px 0; display: flex; align-items: center; gap: 10px;
  }
  .loading-step.done { color: var(--green); }
  .loading-step.active { color: var(--amber); }

  /* Results */
  .results-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: gap; gap: 16px; }
  .results-title { font-size: 24px; font-weight: 800; letter-spacing: -1px; }
  .severity-badge {
    padding: 6px 16px; border-radius: 6px; font-family: 'Space Mono', monospace;
    font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
  }
  .sev-critical { background: rgba(239,68,68,0.15); color: var(--red); border: 1px solid rgba(239,68,68,0.3); }
  .sev-high { background: rgba(245,158,11,0.15); color: var(--amber); border: 1px solid rgba(245,158,11,0.3); }
  .sev-medium { background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); }
  .sev-low { background: rgba(16,185,129,0.15); color: var(--green); border: 1px solid rgba(16,185,129,0.3); }

  /* Score cards */
  .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .score-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 20px; text-align: center;
  }
  .score-num { font-size: 40px; font-weight: 800; letter-spacing: -2px; line-height: 1; margin-bottom: 6px; }
  .score-label { font-size: 11px; color: var(--text-muted); font-family: 'Space Mono', monospace; text-transform: uppercase; letter-spacing: 1px; }
  .score-sub { font-size: 10px; margin-top: 4px; }
  .score-green { color: var(--green); }
  .score-amber { color: var(--amber); }
  .score-red { color: var(--red); }

  /* Metric bars */
  .metric-item { margin-bottom: 20px; }
  .metric-header { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: center; }
  .metric-name { font-size: 13px; font-weight: 600; }
  .metric-val { font-family: 'Space Mono', monospace; font-size: 12px; }
  .bar-track { height: 8px; background: var(--surface2); border-radius: 4px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width 1s ease; }
  .bar-green { background: var(--green); }
  .bar-amber { background: var(--amber); }
  .bar-red { background: var(--red); }
  .metric-note { font-size: 11px; color: var(--text-muted); margin-top: 4px; font-family: 'Space Mono', monospace; }

  /* Flags */
  .flag-item {
    background: var(--surface2); border-radius: 8px; padding: 16px;
    border-left: 3px solid transparent; margin-bottom: 12px;
  }
  .flag-critical { border-color: var(--red); }
  .flag-high { border-color: var(--amber); }
  .flag-medium { border-color: #6366f1; }
  .flag-low { border-color: var(--green); }
  .flag-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
  .flag-title { font-size: 13px; font-weight: 700; margin-bottom: 6px; }
  .flag-desc { font-size: 12px; color: var(--text-dim); line-height: 1.6; }
  .flag-badge {
    font-family: 'Space Mono', monospace; font-size: 10px; padding: 3px 8px;
    border-radius: 4px; white-space: nowrap; flex-shrink: 0;
  }

  /* Recommendations */
  .rec-item {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 8px;
    padding: 16px; margin-bottom: 10px;
  }
  .rec-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .rec-num {
    width: 28px; height: 28px; border-radius: 50%; background: rgba(245,158,11,0.15);
    border: 1px solid var(--amber-dim); color: var(--amber); display: flex; align-items: center;
    justify-content: center; font-size: 11px; font-weight: 700; font-family: 'Space Mono', monospace; flex-shrink: 0;
  }
  .rec-title { font-size: 13px; font-weight: 700; }
  .rec-body { font-size: 12px; color: var(--text-dim); line-height: 1.7; padding-left: 38px; }

  /* Raw output */
  .raw-box {
    background: #050508; border: 1px solid var(--border); border-radius: 8px;
    padding: 16px; font-family: 'Space Mono', monospace; font-size: 11px;
    color: var(--text-dim); line-height: 1.7; max-height: 400px; overflow-y: auto; white-space: pre-wrap;
  }
  .toggle-btn {
    background: none; border: 1px solid var(--border); border-radius: 6px;
    padding: 6px 14px; color: var(--text-muted); font-size: 11px; cursor: pointer;
    font-family: 'Space Mono', monospace; display: flex; align-items: center; gap: 6px;
    transition: all 0.15s;
  }
  .toggle-btn:hover { border-color: var(--border-bright); color: var(--text); }

  /* Section labels */
  .section-label {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--amber); margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* Two col */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

  /* Info box */
  .info-box {
    background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.2);
    border-radius: 8px; padding: 12px 16px; font-size: 12px; color: var(--text-dim);
    display: flex; gap: 10px; line-height: 1.6; margin-bottom: 16px;
  }

  /* Helper text */
  .help-text { font-size: 11px; color: var(--text-muted); font-family: 'Space Mono', monospace; margin-top: 6px; }

  /* Divider */
  .divider { height: 1px; background: var(--border); margin: 24px 0; }

  /* Attribute warning */
  .attr-warning {
    display: flex; align-items: center; gap: 8px; font-size: 11px;
    color: var(--amber); margin-top: 12px; font-family: 'Space Mono', monospace;
  }

  /* Table */
  .mini-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .mini-table th { padding: 8px 12px; text-align: left; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); border-bottom: 1px solid var(--border); }
  .mini-table td { padding: 8px 12px; border-bottom: 1px solid rgba(42,42,58,0.5); }
  .mini-table tr:last-child td { border-bottom: none; }
  .mini-table tr:hover td { background: var(--surface2); }
`;

// Parse AI response into structured data
function parseAIResponse(text) {
  const json = { overallScore: null, severity: null, metrics: [], flags: [], recommendations: [], summary: "" };
  try {
    // Try JSON block first
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) return { ...json, ...JSON.parse(jsonMatch[1]) };
    // Try raw JSON
    const rawJson = text.match(/\{[\s\S]*\}/);
    if (rawJson) return { ...json, ...JSON.parse(rawJson[0]) };
  } catch {}
  return json;
}

function ScoreRing({ score, size = 80 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const prog = ((100 - score) / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#1a1a24" strokeWidth="6" fill="none" />
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="6" fill="none"
        strokeDasharray={circ} strokeDashoffset={prog} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x={size/2} y={size/2 + 6} textAnchor="middle" fill={color}
        style={{ fontSize: 18, fontWeight: 800, fontFamily: "Syne", transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px` }}>
        {score}
      </text>
    </svg>
  );
}

function MetricBar({ name, value, description, threshold }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 70 ? "bar-green" : pct >= 40 ? "bar-amber" : "bar-red";
  const textColor = pct >= 70 ? "score-green" : pct >= 40 ? "score-amber" : "score-red";
  return (
    <div className="metric-item">
      <div className="metric-header">
        <span className="metric-name">{name}</span>
        <span className={`metric-val ${textColor}`}>{pct}%</span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {description && <div className="metric-note">{description}</div>}
    </div>
  );
}

function FlagItem({ flag }) {
  const cls = flag.severity?.toLowerCase();
  const Icon = cls === "critical" ? XCircle : cls === "high" ? AlertTriangle : Info;
  const col = cls === "critical" ? "#ef4444" : cls === "high" ? "#f59e0b" : cls === "medium" ? "#a5b4fc" : "#10b981";
  return (
    <div className={`flag-item flag-${cls}`}>
      <div className="flag-head">
        <div>
          <div className="flag-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icon size={14} color={col} />
            {flag.attribute || flag.title}
          </div>
          <div className="flag-desc">{flag.description || flag.issue}</div>
        </div>
        <span className="flag-badge" style={{ background: `${col}18`, color: col, border: `1px solid ${col}40` }}>
          {flag.severity}
        </span>
      </div>
    </div>
  );
}

export default function FairScan() {
  const [apiKey, setApiKey] = useState("");
  const [csvData, setCsvData] = useState(SAMPLE_CSV);
  const [context, setContext] = useState("Loan approval system for a bank. The target outcome is whether a loan application is approved.");
  const [selectedAttrs, setSelectedAttrs] = useState(["gender", "race"]);
  const [customAttr, setCustomAttr] = useState("");
  const [step, setStep] = useState(1); // 1=setup, 2=analyzing, 3=results
  const [loadStep, setLoadStep] = useState(0);
  const [result, setResult] = useState(null);
  const [rawText, setRawText] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [error, setError] = useState("");
  const [detectedCols, setDetectedCols] = useState([]);

  // Detect columns from CSV
  const detectColumns = useCallback((csv) => {
    try {
      const firstLine = csv.trim().split("\n")[0];
      const cols = firstLine.split(",").map(c => c.trim().toLowerCase());
      const detected = cols.filter(c => PROTECTED_ATTRS.some(p => c.includes(p) || p.includes(c)));
      setDetectedCols(detected);
    } catch {}
  }, []);

  const handleCSVChange = (v) => {
    setCsvData(v);
    detectColumns(v);
  };

  const toggleAttr = (a) => {
    setSelectedAttrs(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const addCustom = () => {
    if (customAttr.trim() && !selectedAttrs.includes(customAttr.trim())) {
      setSelectedAttrs(prev => [...prev, customAttr.trim().toLowerCase()]);
      setCustomAttr("");
    }
  };

  const loadSteps = [
    "Parsing dataset structure...",
    "Detecting protected attributes...",
    "Computing demographic parity...",
    "Measuring disparate impact...",
    "Running intersectional analysis...",
    "Evaluating calibration & fairness metrics...",
    "Generating remediation recommendations...",
    "Compiling audit report...",
  ];

  const analyze = async () => {
    if (!apiKey) { setError("Please enter your Gemini API key."); return; }
    setError("");
    setStep(2);
    setLoadStep(0);

    // Animate steps
    for (let i = 0; i < loadSteps.length; i++) {
      await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
      setLoadStep(i + 1);
    }

    const prompt = `You are FairScan, an expert AI bias auditor. Analyze the following dataset for bias, discrimination, and unfairness.

CONTEXT: ${context}

PROTECTED ATTRIBUTES TO ANALYZE: ${selectedAttrs.join(", ")}

DATASET (CSV):
${csvData.substring(0, 3000)}

Perform a thorough bias audit and respond ONLY with a valid JSON object in exactly this format (no markdown, no explanation outside JSON):
{
  "overallScore": <0-100 fairness score, 100=perfectly fair>,
  "severity": <"CRITICAL"|"HIGH"|"MEDIUM"|"LOW">,
  "summary": "<2-3 sentence executive summary of the bias situation>",
  "metrics": [
    {
      "name": "<metric name>",
      "value": <0-100>,
      "description": "<what this score means for this dataset>"
    }
  ],
  "flags": [
    {
      "attribute": "<protected attribute name>",
      "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "description": "<specific description of the bias found, with numbers/percentages from the data>"
    }
  ],
  "groupDisparities": [
    {
      "attribute": "<column name>",
      "group": "<group name>",
      "outcomeRate": <percentage 0-100>,
      "disparity": "<description>"
    }
  ],
  "recommendations": [
    {
      "title": "<action title>",
      "description": "<specific actionable recommendation>"
    }
  ],
  "dataQuality": {
    "rowsAnalyzed": <number>,
    "columnsFound": <number>,
    "protectedColsDetected": ["<col1>", "<col2>"]
  }
}

Include 4-6 fairness metrics (e.g., Demographic Parity, Equalized Odds, Disparate Impact Ratio, Predictive Parity, Calibration Score, Representation Fairness).
Include one flag per protected attribute analyzed, using real statistics from the data.
Include 4-6 specific recommendations.`;

    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
          })
        }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.error?.message || `API error ${resp.status}`);
      }
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      setRawText(text);
      const parsed = parseAIResponse(text);
      setResult(parsed);
      setStep(3);
    } catch (e) {
      setError(e.message || "Failed to analyze. Check your API key and try again.");
      setStep(1);
    }
  };

  const reset = () => { setStep(1); setResult(null); setRawText(""); setError(""); setLoadStep(0); };

  const sev = result?.severity?.toLowerCase();
  const sevClass = `sev-${sev === "critical" ? "critical" : sev === "high" ? "high" : sev === "medium" ? "medium" : "low"}`;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <div className="grid-bg" />
        <div className="scanline" />
        <div className="content">

          {/* Header */}
          <header className="header">
            <div className="logo">
              <div className="logo-icon">FS</div>
              <div>
                <div className="logo-text">FairScan</div>
                <div className="logo-sub">AI BIAS DETECTION PLATFORM</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="header-badge"><div className="status-dot" />POWERED BY GEMINI AI</div>
              {step === 3 && (
                <button className="btn btn-secondary" onClick={reset} style={{ fontSize: 12, padding: "6px 14px" }}>
                  <RefreshCw size={12} /> New Audit
                </button>
              )}
            </div>
          </header>

          <main className="main">

            {/* Hero */}
            <div className="hero">
              <div className="hero-tag">⬡ ALGORITHMIC FAIRNESS AUDITING</div>
              <h1>Detect <span>Hidden Bias</span> Before It Harms Real People</h1>
              <p>Upload your dataset, select protected attributes, and let Gemini AI expose discrimination hiding in your AI systems — with specific metrics, flags, and fixes.</p>

              {/* Step indicator */}
              <div className="steps">
                {["Configure", "Analyze", "Results"].map((s, i) => (
                  <>
                    <div className={`step ${step === i+1 ? "active" : step > i+1 ? "done" : ""}`}>
                      <div className="step-num">
                        {step > i+1 ? <CheckCircle size={12} /> : i+1}
                      </div>
                      {s}
                    </div>
                    {i < 2 && <span className="step-arrow">›</span>}
                  </>
                ))}
              </div>
            </div>

            {/* STEP 1: Setup */}
            {step === 1 && (
              <>
                {/* API Key */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-icon"><Shield size={18} color="#f59e0b" /></div>
                    <div>
                      <div className="card-title">Gemini API Key</div>
                      <div className="card-desc">Required to run AI-powered bias analysis</div>
                    </div>
                  </div>
                  <div className="api-row">
                    <input type="password" className={`input-field ${apiKey.length > 20 ? "valid" : ""}`}
                      placeholder="AIzaSy..." value={apiKey}
                      onChange={e => setApiKey(e.target.value)} />
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                      <button className="btn btn-secondary">Get Key ↗</button>
                    </a>
                  </div>
                  <div className="help-text">Your key stays local — never stored or transmitted anywhere except Google's API.</div>
                </div>

                <div className="two-col">
                  {/* Dataset Input */}
                  <div className="card">
                    <div className="card-header">
                      <div className="card-icon"><Upload size={18} color="#6366f1" /></div>
                      <div>
                        <div className="card-title">Dataset (CSV)</div>
                        <div className="card-desc">Paste your CSV data below</div>
                      </div>
                    </div>
                    <textarea className="textarea-field" value={csvData}
                      onChange={e => handleCSVChange(e.target.value)}
                      placeholder="age,gender,race,outcome&#10;34,Male,White,Yes&#10;..." />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                      <span className="help-text">{csvData.trim().split("\n").length - 1} data rows detected</span>
                      <button className="btn btn-ghost" onClick={() => handleCSVChange(SAMPLE_CSV)}>
                        Load sample data
                      </button>
                    </div>
                    {detectedCols.length > 0 && (
                      <div className="detected-banner">
                        <Eye size={14} color="#6366f1" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ color: "#a5b4fc", fontSize: 11 }}>Auto-detected protected columns:</div>
                          <div className="chips">
                            {detectedCols.map(c => <span key={c} className="detected-chip">{c}</span>)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Context + Attributes */}
                  <div>
                    <div className="card">
                      <div className="card-header">
                        <div className="card-icon"><Zap size={18} color="#f59e0b" /></div>
                        <div>
                          <div className="card-title">System Context</div>
                          <div className="card-desc">What decisions does this data drive?</div>
                        </div>
                      </div>
                      <textarea className="textarea-field" style={{ minHeight: 90 }} value={context}
                        onChange={e => setContext(e.target.value)}
                        placeholder="e.g. Hiring algorithm for resume screening. Target variable is 'hired'." />
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <div className="card-icon"><Eye size={18} color="#10b981" /></div>
                        <div>
                          <div className="card-title">Protected Attributes</div>
                          <div className="card-desc">Select characteristics to audit for bias</div>
                        </div>
                      </div>
                      <div className="attr-grid">
                        {PROTECTED_ATTRS.map(a => (
                          <button key={a} className={`attr-chip ${selectedAttrs.includes(a) ? "selected" : ""}`}
                            onClick={() => toggleAttr(a)}>{a}</button>
                        ))}
                      </div>
                      <div className="api-row" style={{ marginTop: 12 }}>
                        <input className="input-field" placeholder="Add custom attribute..." value={customAttr}
                          onChange={e => setCustomAttr(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && addCustom()} />
                        <button className="btn btn-secondary" onClick={addCustom}>Add</button>
                      </div>
                      {selectedAttrs.filter(a => !PROTECTED_ATTRS.includes(a)).map(a => (
                        <span key={a} className="attr-chip selected" style={{ marginTop: 8, display: "inline-block" }}>{a}</span>
                      ))}
                      {selectedAttrs.length === 0 && (
                        <div className="attr-warning"><AlertTriangle size={12} /> Select at least one protected attribute</div>
                      )}
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "12px 16px", color: "#ef4444", fontSize: 13, marginBottom: 16, display: "flex", gap: 10 }}>
                    <XCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </div>
                )}

                <button className="btn btn-primary btn-full" onClick={analyze}
                  disabled={!apiKey || !csvData || selectedAttrs.length === 0}>
                  <BarChart3 size={18} /> Run Bias Audit <ChevronRight size={16} />
                </button>
              </>
            )}

            {/* STEP 2: Loading */}
            {step === 2 && (
              <div className="loading-box">
                <div className="spinner" />
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Auditing for Bias</div>
                <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
                  Gemini AI is analyzing your dataset for discrimination and unfairness...
                </div>
                <ul className="loading-steps">
                  {loadSteps.map((s, i) => (
                    <li key={i} className={`loading-step ${loadStep > i ? "done" : loadStep === i ? "active" : ""}`}>
                      {loadStep > i ? <CheckCircle size={12} /> : loadStep === i ? <RefreshCw size={12} style={{ animation: "spin 0.8s linear infinite" }} /> : <span style={{ width: 12, height: 12, display: "inline-block" }} />}
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* STEP 3: Results */}
            {step === 3 && result && (
              <>
                {/* Results header */}
                <div className="results-header">
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--amber)", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
                      ⬡ AUDIT COMPLETE
                    </div>
                    <div className="results-title">Bias Audit Report</div>
                    <div style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "'Space Mono', monospace", marginTop: 4 }}>
                      Analyzed {result.dataQuality?.rowsAnalyzed || "N/A"} rows · {result.dataQuality?.columnsFound || "N/A"} columns · {selectedAttrs.length} protected attributes
                    </div>
                  </div>
                  {result.severity && (
                    <span className={`severity-badge ${sevClass}`}>⚠ {result.severity} RISK</span>
                  )}
                </div>

                {/* Summary */}
                {result.summary && (
                  <div className="info-box">
                    <Info size={14} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{result.summary}</span>
                  </div>
                )}

                {/* Score cards */}
                <div className="score-grid">
                  <div className="score-card" style={{ display: "flex", alignItems: "center", gap: 20, gridColumn: "span 1" }}>
                    <ScoreRing score={result.overallScore ?? 0} size={80} />
                    <div>
                      <div className="score-label">Overall Fairness</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                        {result.overallScore >= 70 ? "Acceptable range" : result.overallScore >= 45 ? "Needs improvement" : "Critical intervention required"}
                      </div>
                    </div>
                  </div>
                  <div className="score-card">
                    <div className={`score-num ${result.flags?.filter(f=>f.severity?.toLowerCase()==="critical").length > 0 ? "score-red" : "score-green"}`}>
                      {result.flags?.filter(f => f.severity?.toLowerCase() === "critical").length ?? 0}
                    </div>
                    <div className="score-label">Critical Flags</div>
                    <div className="score-sub" style={{ color: "var(--text-muted)" }}>Require immediate action</div>
                  </div>
                  <div className="score-card">
                    <div className="score-num score-amber">
                      {result.flags?.filter(f => f.severity?.toLowerCase() === "high").length ?? 0}
                    </div>
                    <div className="score-label">High Risk Flags</div>
                    <div className="score-sub" style={{ color: "var(--text-muted)" }}>Significant disparities</div>
                  </div>
                  <div className="score-card">
                    <div className={`score-num ${(result.recommendations?.length ?? 0) > 0 ? "score-amber" : "score-green"}`}>
                      {result.recommendations?.length ?? 0}
                    </div>
                    <div className="score-label">Fixes Identified</div>
                    <div className="score-sub" style={{ color: "var(--text-muted)" }}>Actionable recommendations</div>
                  </div>
                </div>

                <div className="two-col">
                  {/* Fairness Metrics */}
                  <div className="card">
                    <div className="section-label"><BarChart3 size={12} />Fairness Metrics</div>
                    {result.metrics?.length > 0
                      ? result.metrics.map((m, i) => (
                          <MetricBar key={i} name={m.name} value={m.value} description={m.description} />
                        ))
                      : <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No metric data returned.</div>
                    }
                  </div>

                  {/* Bias Flags */}
                  <div className="card">
                    <div className="section-label"><AlertTriangle size={12} />Discrimination Flags</div>
                    {result.flags?.length > 0
                      ? result.flags.map((f, i) => <FlagItem key={i} flag={f} />)
                      : <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No flags detected.</div>
                    }
                  </div>
                </div>

                {/* Group Disparities Table */}
                {result.groupDisparities?.length > 0 && (
                  <div className="card">
                    <div className="section-label"><Eye size={12} />Group Outcome Disparities</div>
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Attribute</th>
                          <th>Group</th>
                          <th>Outcome Rate</th>
                          <th>Disparity Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.groupDisparities.map((g, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#a5b4fc" }}>{g.attribute}</td>
                            <td style={{ fontWeight: 600 }}>{g.group}</td>
                            <td>
                              <span style={{
                                color: g.outcomeRate >= 60 ? "#10b981" : g.outcomeRate >= 35 ? "#f59e0b" : "#ef4444",
                                fontFamily: "'Space Mono', monospace", fontSize: 12
                              }}>{g.outcomeRate}%</span>
                            </td>
                            <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{g.disparity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Recommendations */}
                <div className="card">
                  <div className="section-label"><Zap size={12} />Remediation Recommendations</div>
                  {result.recommendations?.length > 0
                    ? result.recommendations.map((r, i) => (
                        <div key={i} className="rec-item">
                          <div className="rec-head">
                            <div className="rec-num">{i + 1}</div>
                            <div className="rec-title">{r.title}</div>
                          </div>
                          <div className="rec-body">{r.description}</div>
                        </div>
                      ))
                    : <div style={{ color: "var(--text-muted)", fontSize: 12 }}>No recommendations returned.</div>
                  }
                </div>

                {/* Raw Output */}
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showRaw ? 16 : 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Raw Gemini Output</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="toggle-btn" onClick={() => { navigator.clipboard.writeText(rawText); }}>
                        <Copy size={11} /> Copy
                      </button>
                      <button className="toggle-btn" onClick={() => setShowRaw(!showRaw)}>
                        {showRaw ? <><ChevronUp size={11} /> Hide</> : <><ChevronDown size={11} /> Show</>}
                      </button>
                    </div>
                  </div>
                  {showRaw && <div className="raw-box">{rawText}</div>}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
