"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Plik: server/src/index.ts (przykładowa nazwa)
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Funkcja bootstrap uruchamia serwer, zwracając Promise.
// Dzięki temu możemy wywołać .then(...) i .catch(...), unikając "floating promises".
async function bootstrap() {
    const app = (0, express_1.default)();
    const PORT = process.env.PORT || 5000;
    // Middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // Przykładowa trasa
    app.get('/api', (req, res) => {
        res.json({ message: 'Backend TypeScript działa poprawnie!' });
    });
    // Zwracamy Promise, który rozwiąże się po pomyślnym uruchomieniu serwera
    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, () => {
            console.log(`Serwer nasłuchuje na porcie ${PORT}`);
            resolve(); // Informujemy o powodzeniu
        });
        // Jeśli serwer napotka błąd w czasie startu lub później
        server.on('error', (err) => {
            reject(err);
        });
    });
}
// Wywołanie funkcji bootstrap z obsługą błędów
bootstrap()
    .then(() => {
    console.log('Serwer uruchomiony pomyślnie!');
})
    .catch((err) => {
    console.error('Wystąpił błąd podczas uruchamiania serwera:', err);
    process.exit(1); // Możesz zdecydować, czy kończyć proces lub obsłużyć błąd inaczej
});
