import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "../firebase";
import "../App.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================
  // LOGIN
  // ==========================================
  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    setError("");
    setSuccess("");

    // ------------------------------------------
    // EMPTY INPUTS
    // ------------------------------------------
    if (trimmedEmail === "" && password === "") {
      setError("Please enter your email and password.");
      return;
    }

    if (trimmedEmail === "") {
      setError("Please enter your email.");
      return;
    }

    if (password === "") {
      setError("Please enter your password.");
      return;
    }

    // ------------------------------------------
    // EMAIL VALIDATION
    // ------------------------------------------
    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!validEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    // ------------------------------------------
    // PASSWORD VALIDATION
    // Minimum 6 characters + at least 1 number
    // ------------------------------------------
    const validPassword =
      password.length >= 6 &&
      /[0-9]/.test(password);

    if (!validPassword) {
      setError(
        "Password must contain at least 6 characters and one number."
      );
      return;
    }

    // ------------------------------------------
    // FIREBASE LOGIN
    // ------------------------------------------
    try {
      setLoading(true);

      await setPersistence(
        auth,
        rememberMe
          ? browserLocalPersistence
          : browserSessionPersistence
      );

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          trimmedEmail,
          password
        );

      const user = userCredential.user;

      // ------------------------------------------
      // GET FIREBASE ID TOKEN
      // ------------------------------------------
      const token = await user.getIdToken();

      // Save authenticated user information
      localStorage.setItem(
        "firebaseIdToken",
        token
      );

      localStorage.setItem(
        "firebaseUserId",
        user.uid
      );

      localStorage.setItem(
        "firebaseUserEmail",
        user.email || trimmedEmail
      );

      localStorage.setItem(
        "mindcareUser",
        user.email || trimmedEmail
      );

      if (rememberMe) {
        localStorage.setItem(
          "mindcareRemember",
          "true"
        );
      } else {
        localStorage.removeItem(
          "mindcareRemember"
        );
      }

      setError("");
      setSuccess("Login successful.");

      // ------------------------------------------
      // GO TO DASHBOARD
      // ------------------------------------------
      navigate("/dashboard");
    } catch (firebaseError) {
      console.error(
        "Firebase login error:",
        firebaseError
      );

      switch (firebaseError.code) {
        case "auth/invalid-credential":
        case "auth/invalid-login-credentials":
          setError("Incorrect email or password.");
          break;

        case "auth/user-not-found":
          setError(
            "No account was found with this email."
          );
          break;

        case "auth/wrong-password":
          setError("Incorrect password.");
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many login attempts. Please try again later."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError(
            "Unable to log in. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ENTER KEY
  // ==========================================
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================
  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();

    setError("");
    setSuccess("");

    if (trimmedEmail === "") {
      setError(
        "Enter your email address first, then click Forgot Password."
      );
      return;
    }

    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!validEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(
        auth,
        trimmedEmail
      );

      setSuccess(
        "Password reset email sent. Please check your inbox."
      );
    } catch (firebaseError) {
      console.error(
        "Password reset error:",
        firebaseError
      );

      switch (firebaseError.code) {
        case "auth/user-not-found":
          setError(
            "No account was found with this email."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError(
            "Unable to send the password reset email."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGIN PAGE
  // ==========================================
  return (
    <div className="login-page">

      {/* ========================================
          BACKGROUND DECORATION
      ======================================== */}
      <div className="login-background">
        <div className="login-orb orb-one"></div>
        <div className="login-orb orb-two"></div>
        <div className="login-orb orb-three"></div>

        <div className="mountain mountain-back"></div>
        <div className="mountain mountain-middle"></div>
        <div className="mountain mountain-front"></div>

        <span className="star star-one">✦</span>
        <span className="star star-two">•</span>
        <span className="star star-three">✦</span>
        <span className="star star-four">•</span>
        <span className="star star-five">✦</span>
        <span className="star star-six">•</span>
      </div>

      {/* ========================================
          LOGIN CARD
      ======================================== */}
      <div className="login-card">

        {/* TOP VISUAL */}
        <div className="login-visual">
          <div className="moon"></div>

          <div className="floating-cloud cloud-one"></div>
          <div className="floating-cloud cloud-two"></div>
          <div className="floating-cloud cloud-three"></div>

          <div className="visual-mountain visual-back"></div>
          <div className="visual-mountain visual-middle"></div>
          <div className="visual-mountain visual-front"></div>

          <span className="visual-star visual-star-one">
            ✦
          </span>

          <span className="visual-star visual-star-two">
            •
          </span>

          <span className="visual-star visual-star-three">
            ✦
          </span>
        </div>

        {/* DOWN ARROW */}
        <div className="login-arrow">
          ↓
        </div>

        {/* LOGIN CONTENT */}
        <div className="login-content">

          {/* BRAND */}
          <div className="login-brand">
            <div className="login-logo">
              M
            </div>

            <div>
              <h1>MindCare</h1>
              <p>Cognitive Training</p>
            </div>
          </div>

          <div className="login-divider"></div>

          {/* LOGIN HEADING */}
          <div className="login-heading">
            <h2>USER LOGIN</h2>

            <p>
              Continue your cognitive training journey
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="login-error">
              <span>⚠</span>
              <p>{error}</p>
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="login-success">
              <span>✓</span>
              <p>{success}</p>
            </div>
          )}

          {/* EMAIL */}
          <div className="login-input-group">
            <label>EMAIL</label>

            <div className="login-input-wrapper">
              <span className="input-icon">
                ✉
              </span>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="login-input-group">
            <label>PASSWORD</label>

            <div className="login-input-wrapper">
              <span className="input-icon">
                🔒
              </span>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                  setSuccess("");
                }}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* OPTIONS */}
          <div className="login-options">

            <label className="remember-option">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked
                  )
                }
              />

              <span className="custom-checkbox">
                ✓
              </span>

              <span>
                Keep me logged in
              </span>
            </label>

            <button
              className="forgot-password"
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot Password?
            </button>

          </div>

          {/* LOGIN BUTTON */}
          <button
            className="login-button"
            onClick={handleLogin}
            type="button"
            disabled={loading}
          >
            <span>
              {loading ? "PLEASE WAIT..." : "LOGIN"}
            </span>

            <span className="login-button-arrow">
              →
            </span>
          </button>

        </div>
      </div>

      {/* FOOTER */}
      <div className="login-footer">
        <span className="footer-logo">
          M
        </span>

        <span>
          MindCare
        </span>

        <span className="footer-separator">
          •
        </span>

        <span>
          Cognitive Training
        </span>
      </div>

    </div>
  );
}

export default Login;