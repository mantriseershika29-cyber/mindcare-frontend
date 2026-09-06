import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCaregiverDashboard } from "../caregiverDashboardApi";
import "../caregiverDashboard.css";

const GAMES = ["pattern_recall", "sequencing", "face_name_matching", "object_placement"];
const GAME_LABELS = {
  pattern_recall: "Pattern Recall",
  sequencing: "Sequencing",
  face_name_matching: "Face–Name Matching",
  object_placement: "Object Placement",
};

const MOCK_PERFORMANCE = [
  { gameType: "pattern_recall", accuracy: 85, errors: 1, responseTimeSeconds: 40, level: 2, createdAt: "2026-09-01T10:00:00" },
  { gameType: "sequencing", accuracy: 78, errors: 2, responseTimeSeconds: 45, level: 1, createdAt: "2026-09-02T10:00:00" },
  { gameType: "face_name_matching", accuracy: 82, errors: 1, responseTimeSeconds: 42, level: 2, createdAt: "2026-09-03T10:00:00" },
  { gameType: "object_placement", accuracy: 88, errors: 0, responseTimeSeconds: 38, level: 3, createdAt: "2026-09-04T10:00:00" },
];

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function levelValue(currentLevel, game) {
  if (typeof currentLevel === "number") return currentLevel;
  if (currentLevel && typeof currentLevel === "object") return number(currentLevel[game], 1);
  return 1;
}

function TrendChart({ title, values, unit, max }) {
  const width = 640;
  const height = 220;
  const pad = 28;
  const usableW = width - pad * 2;
  const usableH = height - pad * 2;
  const safe = values.length ? values : [0];
  const top = max || Math.max(...safe, 1);
  const points = safe.map((value, index) => {
    const x = safe.length === 1 ? width / 2 : pad + (index * usableW) / (safe.length - 1);
    const y = height - pad - (number(value) / top) * usableH;
    return `${x},${Math.max(pad, Math.min(height - pad, y))}`;
  }).join(" ");

  return (
    <section className="cg-dashboard-section">
      <h2>{title}</h2>
      <div className="cg-performance-card" style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={`${title} chart`}>
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="currentColor" strokeWidth="1" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="currentColor" strokeWidth="1" />
          <polyline fill="none" stroke="currentColor" strokeWidth="3" points={points} />
          {safe.map((value, index) => {
            const x = safe.length === 1 ? width / 2 : pad + (index * usableW) / (safe.length - 1);
            const y = height - pad - (number(value) / top) * usableH;
            return <circle key={index} cx={x} cy={Math.max(pad, Math.min(height - pad, y))} r="5" fill="currentColor" />;
          })}
        </svg>
        <p style={{ margin: 0, fontSize: "0.9rem" }}>Sessions: {safe.map((_, i) => i + 1).join("  •  ")} {unit ? `• ${unit}` : ""}</p>
      </div>
    </section>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem("firebaseUserId") || localStorage.getItem("userId") || localStorage.getItem("uid");
    if (!userId) {
      setData({ progress: {}, performance: MOCK_PERFORMANCE });
      setUsingMock(true);
      setLoading(false);
      return;
    }

    fetchCaregiverDashboard(userId)
      .then((result) => setData(result))
      .catch(() => {
        setData({ progress: {}, performance: MOCK_PERFORMANCE });
        setUsingMock(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const performance = useMemo(() => {
    const raw = data?.performance;
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.performances)
      ? raw.performances
      : Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.performance)
      ? raw.performance
      : [];
    return list.map((item) => ({
      gameType: item.gameType || item.game_type || "unknown",
      accuracy: number(item.accuracy),
      errors: number(item.errors),
      responseTimeSeconds: number(item.responseTimeSeconds ?? item.response_time_seconds),
      level: number(item.level, 1),
      createdAt: item.createdAt || item.created_at || "",
    }));
  }, [data]);

  const progress = data?.progress || {};
  const averageAccuracy = number(progress.averageAccuracy, performance.length ? performance.reduce((s, p) => s + p.accuracy, 0) / performance.length : 0);
  const sessions = number(progress.totalGames, performance.length);
  const totalErrors = performance.reduce((s, p) => s + p.errors, 0);
  const averageResponse = performance.length ? performance.reduce((s, p) => s + p.responseTimeSeconds, 0) / performance.length : 0;
  const breakdown = progress.gameTypeBreakdown || {};
  const recent = [...performance].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5);

  if (loading) return <div className="cg-app-page"><main className="cg-dashboard-content"><h1>Loading caregiver dashboard…</h1></main></div>;

  return (
    <div className="cg-app-page">
      <header className="cg-topbar">
        <div className="cg-logo">CAREGIVER DASHBOARD</div>
        <button className="cg-link-button" onClick={() => navigate("/")}>LOG OUT</button>
      </header>

      <main className="cg-dashboard-content">
        <section className="cg-welcome">
          <div>
            <p className="cg-section-label">CAREGIVER VIEW</p>
            <h1>Performance Overview</h1>
            <p>Review game activity and progress in a simple, non-diagnostic view.</p>
          </div>
        </section>

        {usingMock && <div className="cg-performance-card"><strong>Preview mode:</strong> showing placeholder data until a user ID and backend connection are available.</div>}

        <section className="cg-stats">
          <div className="cg-stat-box"><p>GAMES COMPLETED</p><strong>{sessions}</strong></div>
          <div className="cg-stat-box"><p>AVERAGE ACCURACY</p><strong>{Math.round(averageAccuracy)}%</strong></div>
          <div className="cg-stat-box"><p>AVERAGE RESPONSE TIME</p><strong>{Math.round(averageResponse)} sec</strong></div>
          <div className="cg-stat-box"><p>TOTAL ERRORS</p><strong>{totalErrors}</strong></div>
        </section>

        <section className="cg-dashboard-section">
          <h2>GAME-WISE PERFORMANCE</h2>
          <div className="cg-performance-card">
            {GAMES.map((game) => {
              const gameRecords = performance.filter((p) => p.gameType === game);
              const apiValue = number(breakdown[game]?.accuracy ?? breakdown[GAME_LABELS[game]]?.accuracy, gameRecords.length ? gameRecords.reduce((s, p) => s + p.accuracy, 0) / gameRecords.length : 0);
              return <p key={game}>{GAME_LABELS[game]} — {Math.round(apiValue)}%</p>;
            })}
          </div>
        </section>

        <TrendChart title="PERFORMANCE TREND" values={performance.map((p) => p.accuracy)} unit="Accuracy (%)" max={100} />
        <TrendChart title="RESPONSE TIME TREND" values={performance.map((p) => p.responseTimeSeconds)} unit="Response time (sec)" />

        <section className="cg-dashboard-section">
          <h2>DIFFICULTY PROGRESSION</h2>
          <div className="cg-performance-card">
            {GAMES.map((game) => {
              const current = levelValue(progress.currentLevel, game);
              const history = performance.filter((p) => p.gameType === game).map((p) => p.level).filter(Boolean);
              return <p key={game}><strong>{GAME_LABELS[game]}:</strong> Level {current} — {history.length ? `history ${history.join(" → ")}` : "no history yet"}</p>;
            })}
          </div>
        </section>

        <section className="cg-dashboard-section">
          <h2>RECENT ACTIVITY</h2>
          <div className="cg-activity-card">
            {recent.length ? recent.map((item, index) => (
              <p key={`${item.createdAt}-${index}`}>
                {GAME_LABELS[item.gameType] || item.gameType} — {Math.round(item.accuracy)}% — Level {item.level} — {Math.round(item.responseTimeSeconds)} sec
              </p>
            )) : <p>No completed sessions yet.</p>}
          </div>
        </section>

        <section className="cg-dashboard-section">
          <div className="cg-section-heading-row">
            <div><h2>COGNITIVE GAMES</h2><p>Select an activity to begin.</p></div>
            <button className="cg-game-button" onClick={() => navigate("/games")}>PLAY GAMES</button>
          </div>
        </section>

        <p style={{ fontSize: "0.85rem", opacity: 0.8 }}>
          Caregiver information is intended for activity monitoring only and should not be interpreted as a medical diagnosis.
        </p>
      </main>
    </div>
  );
}

export default Dashboard;
