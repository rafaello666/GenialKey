"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsModal = void 0;
// src/components/SettingsModal.tsx
const react_1 = __importStar(require("react"));
const SettingsModal = ({ isOpen, onClose }) => {
    const [difficulty, setDifficulty] = (0, react_1.useState)('medium');
    if (!isOpen)
        return null; // nie renderuj nic, jeśli modal ma być ukryty
    const handleSave = () => {
        // np. wysyłasz difficulty do globalnego stanu lub wykonujesz zapytanie
        onClose(); // zamknij modal po zapisaniu
    };
    return (<div className="modal-overlay" onClick={onClose}>
      {/* Zapobiegamy zamykaniu modala po kliknięciu w 'okno' */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Ustawienia</h3>

        <label htmlFor="difficulty">Poziom trudności:</label>
        <select id="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Łatwy</option>
          <option value="medium">Średni</option>
          <option value="hard">Trudny</option>
        </select>

        <div className="modal-buttons">
          <button onClick={handleSave}>Zapisz</button>
          <button onClick={onClose}>Anuluj</button>
        </div>
      </div>
    </div>);
};
exports.SettingsModal = SettingsModal;
