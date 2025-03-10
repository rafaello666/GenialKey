"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTimer = useTimer;
const react_1 = require("react");
function useTimer(initialSeconds) {
    const [seconds, setSeconds] = (0, react_1.useState)(initialSeconds);
    const [isRunning, setIsRunning] = (0, react_1.useState)(false);
    const intervalRef = (0, react_1.useRef)(null);
    // Rozpocznij odliczanie (ustawia isRunning = true, jeśli nie trwa)
    const start = (0, react_1.useCallback)(() => {
        if (!isRunning) {
            setIsRunning(true);
        }
    }, [isRunning]);
    // Wstrzymaj odliczanie (setIsRunning = false)
    const pause = (0, react_1.useCallback)(() => {
        setIsRunning(false);
    }, []);
    // Wznów odliczanie (jeśli jest zatrzymane)
    const resume = (0, react_1.useCallback)(() => {
        if (!isRunning) {
            setIsRunning(true);
        }
    }, [isRunning]);
    // Zrestartuj do wartości początkowej
    const restart = (0, react_1.useCallback)(() => {
        setSeconds(initialSeconds);
        setIsRunning(false);
    }, [initialSeconds]);
    // Główna pętla timera
    (0, react_1.useEffect)(() => {
        // Jeżeli timer jest uruchomiony, to co 1s dekrementujemy
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds((prev) => {
                    if (prev <= 1) {
                        // Gdy czas dobiega końca, zatrzymaj odliczanie
                        clearInterval(intervalRef.current);
                        setIsRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        // Sprzątanie po odmontowaniu lub zmianie
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);
    return {
        seconds,
        isRunning,
        start,
        pause,
        resume,
        restart,
    };
}
