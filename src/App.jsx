import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CaregiverDashboard from "./pages/CaregiverDashboard";
import GameSelection from "./pages/GameSelection";

import FaceNameMatching from "./pages/FaceNameMatching";
import ObjectPlacement from "./pages/ObjectPlacement";
import PatternRecall from "./pages/PatternRecall";
import Sequencing from "./pages/Sequencing";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            LOGIN
        ========================= */}
        <Route
          path="/"
          element={<Login />}
        />


        {/* =========================
            DASHBOARD
        ========================= */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* =========================
            CAREGIVER DASHBOARD
        ========================= */}
        <Route
          path="/caregiver"
          element={<CaregiverDashboard />}
        />


        {/* =========================
            GAME SELECTION
        ========================= */}
        <Route
          path="/games"
          element={<GameSelection />}
        />


        {/* =========================
            PATTERN RECALL
        ========================= */}
        <Route
          path="/pattern-recall"
          element={<PatternRecall />}
        />


        {/* =========================
            SEQUENCING
        ========================= */}
        <Route
          path="/sequencing"
          element={<Sequencing />}
        />


        {/* =========================
            FACE NAME MATCHING
        ========================= */}
        <Route
          path="/face-name-matching"
          element={<FaceNameMatching />}
        />


        {/* =========================
            OBJECT PLACEMENT
        ========================= */}
        <Route
          path="/object-placement"
          element={<ObjectPlacement />}
        />


        {/* =========================
            UNKNOWN URL
            → GO TO LOGIN
        ========================= */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;