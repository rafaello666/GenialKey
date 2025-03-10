"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
var React = ;
{
    useState;
}
from;
'react';
const client_1 = __importDefault(require("react-dom/client"));
require("./styles/main.css"); // <-- importujemy plik CSS
const SettingsModal_1 = require("./components/SettingsModal");
const root = client_1.default.createRoot(document.getElementById('root'));
const App = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    root.render(<App />);
    export function App() {
        return (<div className="App">
      <header className="App-header">
      <button onClick={() => setIsSettingsOpen(true)}>Ustawienia</button>,
      
        <h1 className="typewriter">,
          TWOJ NAJZAJEBISTSZY PROGRAM DO BEZWZROKOWEGO PISANIA
        </h1>
        <p>
          Wersja alfa. Budujemy apkę, aby była jak najwygodniejsza w nauce szybkiego pisania.
        </p>
        <button className="button">Start</button>,
      </header>
      <SettingsModal_1.SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}/>,
      {/* dalsza część aplikacji */};
    </div>);
    }
};
exports.App = App;
