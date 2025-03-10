"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// pages/lessons/timer.tsx
const react_1 = __importDefault(require("react"));
const AnimatedNumber_1 = __importDefault(require("../../components/AnimatedNumber"));
const useTimer_1 = require("../../hooks/useTimer");
const TimerPage = () => {
    const { seconds, start } = (0, useTimer_1.useTimer)(60);
    return (<div>
      <button onClick={start}>Start Timer</button>
      <AnimatedNumber_1.default value={seconds}/>
    </div>);
};
exports.default = TimerPage;
