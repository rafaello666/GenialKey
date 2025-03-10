"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const router_1 = require("next/router");
const AnimatedTimer_1 = __importDefault(require("../../components/AnimatedTimer"));
const AnimatedTimerPage = () => {
    const router = (0, router_1.useRouter)();
    // Funkcja, która zostanie wywołana po osiągnięciu 0s
    const handleTimerEnd = () => {
        alert('Czas minął! Przechodzimy do podsumowania...');
        router.push('/summary');
    };
    return (<div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h1>Lekcja - z animowanym Timerem</h1>
      <p>Masz 20 sekund na wykonanie ćwiczenia!</p>

      <AnimatedTimer_1.default initialSeconds={20} onTimerEnd={handleTimerEnd}/>
    </div>);
};
exports.default = AnimatedTimerPage;
