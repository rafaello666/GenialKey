"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerSideProps = void 0;
const react_1 = __importDefault(require("react"));
const link_1 = __importDefault(require("next/link"));
const SummaryScreen_module_css_1 = __importDefault(require("../styles/SummaryScreen.module.css"));
const getServerSideProps = async () => {
    // Tu np. fetch z backendu NestJS:
    // const res = await fetch('https://twoja-domena.pl/api/typing-results/last');
    // const data = await res.json();
    // W przykładzie wpiszmy wartości na sztywno
    const data = { wpm: 85, accuracy: 94 };
    const SummaryScreen = ({ wpm, accuracy }) => {
        return (<div className={SummaryScreen_module_css_1.default.summaryScreen}>
          <h1>Podsumowanie ćwiczenia</h1>
          <p>Twoja prędkość pisania: <strong>{wpm} WPM</strong></p>
          <p>Twoja dokładność: <strong>{accuracy}%</strong></p>
    
          <div className={SummaryScreen_module_css_1.default.actions}>
            <link_1.default href="/typing-results">
              <button className={SummaryScreen_module_css_1.default.primaryButton}>Zapisz wynik</button>
            </link_1.default>
            <link_1.default href="/ranking">
              <button className={SummaryScreen_module_css_1.default.secondaryButton}>Tabela wyników</button>
            </link_1.default>
            <link_1.default href="/courses">
              <button className={SummaryScreen_module_css_1.default.secondaryButton}>Wybierz kolejne ćwiczenie</button>
            </link_1.default>
          </div>
        </div>);
    };
    const userWpm = wpm || 0;
    const userAccuracy = accuracy || 0;
    return {
        props: {
            wpm: data.wpm,
            accuracy: data.accuracy,
        },
    };
};
exports.getServerSideProps = getServerSideProps;
return (<div className={SummaryScreen_module_css_1.default.summaryScreen}>
      <h1>Podsumowanie ćwiczenia</h1>
      <p>Twoja prędkość pisania: <strong>{userWpm} WPM</strong></p>
      <p>Twoja dokładność: <strong>{userAccuracy}%</strong></p>

      <div className={SummaryScreen_module_css_1.default.actions}>
        <link_1.default href="/typing-results">
          <button className={SummaryScreen_module_css_1.default.primaryButton}>Zapisz wynik</button>
        </link_1.default>

        <link_1.default href="/ranking">
          <button className={SummaryScreen_module_css_1.default.secondaryButton}>Tabela wyników</button>
        </link_1.default>

        <link_1.default href="/courses">
          <button className={SummaryScreen_module_css_1.default.secondaryButton}>Wybierz kolejne ćwiczenie</button>
        </link_1.default>
      </div>
    </div>);
;
exports.default = SummaryScreen;
