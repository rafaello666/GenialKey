import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/main.css';  // <-- importujemy plik CSS
import { SettingsModal } from './components/SettingsModal';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

export const App: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={() => setIsSettingsOpen(true)}>Ustawienia</button>
        <h1 className="typewriter">
          TWOJ NAJZAJEBISTSZY PROGRAM DO BEZWZROKOWEGO PISANIA
        </h1>
        <p>
          Wersja alfa. Budujemy apkę, aby była jak najwygodniejsza w nauce szybkiego pisania.
        </p>
        <button className="button">Start</button>
      </header>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      {/* dalsza część aplikacji */}
    </div>
  );
}

root.render(<App />);
