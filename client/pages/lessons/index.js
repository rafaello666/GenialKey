"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const router_1 = require("next/router");
const Timer_1 = __importDefault(require("../../components/Timer"));
const LessonsPage = () => {
    const router = (0, router_1.useRouter)();
    const handleTimerEnd = () => {
        router.push('/summary');
    };
    return (<div style={{ padding: '2rem' }}>
      <h1>Lekcja 1</h1>
      <p>Rozpocznij ćwiczenie pisania. Masz 60 sekund.</p>

      <Timer_1.default initialSeconds={60} onTimerEnd={handleTimerEnd}/>
          </div>);
};
exports.default = LessonsPage;
