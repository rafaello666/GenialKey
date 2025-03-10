"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const StatsChart_1 = __importDefault(require("../components/StatsChart"));
const StatsPage = () => {
    // Przykładowe dane – w realnym scenariuszu pobierzesz z backendu (NestJS)
    const labels = ['Lekcja 1', 'Lekcja 2', 'Lekcja 3', 'Lekcja 4'];
    const data = [42, 48, 51, 60];
    return (<div style={{ width: '80%', margin: '0 auto', marginTop: '2rem' }}>
      <h1>Statystyki WPM</h1>
      <p>Przegląd historycznych wyników (słów na minutę):</p>
      <StatsChart_1.default labels={labels} data={data}/>
    </div>);
};
exports.default = StatsPage;
