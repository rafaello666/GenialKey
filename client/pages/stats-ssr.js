"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerSideProps = void 0;
// pages/stats-ssr.tsx
const react_1 = __importDefault(require("react"));
const axios_1 = __importDefault(require("axios"));
const StatsSSRPage = ({ stats }) => {
    return (<div style={{ margin: '2rem' }}>
      <h1>Statystyki (SSR)</h1>
      <p>Dane renderowane po stronie serwera przy każdym żądaniu.</p>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>UserID</th>
            <th>WPM</th>
            <th>Accuracy</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((item, index) => (<tr key={index}>
              <td>{item.userId}</td>
              <td>{item.wpm}</td>
              <td>{item.accuracy}%</td>
              <td>{item.date}</td>
            </tr>))}
        </tbody>
      </table>
    </div>);
};
exports.default = StatsSSRPage;
const getServerSideProps = async () => {
    try {
        const response = await axios_1.default.get('https://szczepanekkinga.org/api/stats');
        return {
            props: {
                stats: response.data, // przekazujemy do komponentu
            },
        };
    }
    catch (error) {
        console.error('Błąd SSR:', error);
        // Możesz np. zwrócić pustą tablicę lub przekierować do strony błędu
        return {
            props: {
                stats: [],
            },
        };
    }
    ;
};
exports.getServerSideProps = getServerSideProps;
