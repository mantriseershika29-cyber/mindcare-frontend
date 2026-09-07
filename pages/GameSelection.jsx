import { useNavigate } from "react-router-dom";
import "../Game.css";

function GameSelection() {
  const navigate = useNavigate();

  return (
    <div className="game-page">

      {/* BACK TO DASHBOARD */}
      <button
        className="game-back-button"
        onClick={() => navigate("/dashboard")}
      >
        ← DASHBOARD
      </button>


      <div className="game-board game-selection-board">

        <h1 className="game-title">
          GAMES
        </h1>


        <div className="game-selection-grid">

          {/* PATTERN RECALL */}
          <div className="game-card">

            <div>
              <h2>PATTERN RECALL</h2>

              <p>
                Remember the pattern you see and recreate it.
              </p>
            </div>

            <button
              className="game-button"
              onClick={() => navigate("/pattern-recall")}
            >
              START
            </button>

          </div>


          {/* SEQUENCING */}
          <div className="game-card">

            <div>
              <h2>SEQUENCING</h2>

              <p>
                Remember and reproduce the correct sequence.
              </p>
            </div>

            <button
              className="game-button"
              onClick={() => navigate("/sequencing")}
            >
              START
            </button>

          </div>


          {/* FACE NAME MATCHING */}
          <div className="game-card">

            <div>
              <h2>FACE–NAME MATCHING</h2>

              <p>
                Match each face with the correct name.
              </p>
            </div>

            <button
              className="game-button"
              onClick={() => navigate("/face-name-matching")}
            >
              START
            </button>

          </div>


          {/* OBJECT PLACEMENT */}
          <div className="game-card">

            <div>
              <h2>OBJECT PLACEMENT</h2>

              <p>
                Remember where each object belongs.
              </p>
            </div>

            <button
              className="game-button"
              onClick={() => navigate("/object-placement")}
            >
              START
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default GameSelection;