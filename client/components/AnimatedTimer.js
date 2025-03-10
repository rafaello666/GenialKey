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
const react_1 = __importStar(require("react"));
const framer_motion_1 = require("framer-motion");
const useTimer_1 = require("../hooks/useTimer");
const AnimatedTimer = ({ initialSeconds, onTimerEnd }) => {
    const { seconds, isRunning, start, pause, resume, restart } = (0, useTimer_1.useTimer)(initialSeconds);
    // Kiedy licznik dojdzie do 0, wywołaj callback, jeśli jest podany
    (0, react_1.useEffect)(() => {
        if (seconds === 0 && onTimerEnd) {
            onTimerEnd();
        }
    }, [seconds, onTimerEnd]);
    return (<div style={styles.container}>
      {/* Sekcja wyświetlania czasu z animacją */}
      <framer_motion_1.AnimatePresence mode="popLayout">
        {/* Klucz zależny od aktualnej wartości seconds, by Framer Motion animował zmianę */}
        <framer_motion_1.motion.div key={seconds} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.3 }} style={styles.timerValue}>
          {seconds}
        </framer_motion_1.motion.div>
      </framer_motion_1.AnimatePresence>

      {/* Panel przycisków */}
      <div style={styles.buttons}>
        {!isRunning && seconds === initialSeconds && (<button onClick={start}>Start</button>)}
        {isRunning && <button onClick={pause}>Pause</button>}
        {!isRunning && seconds > 0 && seconds < initialSeconds && (<button onClick={resume}>Resume</button>)}
        <button onClick={restart}>Restart</button>
      </div>
    </div>);
};
exports.default = AnimatedTimer;
// Proste style inline – można oczywiście przenieść do .module.css
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
    },
    timerValue: {
        fontSize: '4rem',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttons: {
        display: 'flex',
        gap: '0.5rem',
    },
};
