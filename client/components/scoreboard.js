"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scoreboard = void 0;
// src/components/Scoreboard.tsx
const react_1 = __importDefault(require("react"));
const Scoreboard = ({ scores }) => {
    return (<div className="scoreboard-container">
      <h2>Wyniki</h2>
      <table className="scoreboard-table">
        <thead>
          <tr>
            <th>Użytkownik</th>
            <th>Słowa/min</th>
            <th>Dokładność (%)</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((score, idx) => (<tr key={idx}>
              <td>{score.username}</td>
              <td>{score.wpm}</td>
              <td>{score.accuracy}</td>
              <td>{score.date}</td>
            </tr>))}
        </tbody>
      </table>
    </div>);
};
exports.Scoreboard = Scoreboard;
