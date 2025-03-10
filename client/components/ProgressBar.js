"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
// np. ProgressBar.tsx
const react_1 = __importDefault(require("react"));
const ProgressBar = ({ value }) => {
    return (<div className="progress-bar-container">
      <div className="progress-bar-fill" style={{ width: `${value}%` }}/>
    </div>);
};
exports.ProgressBar = ProgressBar;
