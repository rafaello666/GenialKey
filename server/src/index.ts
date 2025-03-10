// Plik: server/src/index.ts (przykładowa nazwa)
import express, { Request, Response } from 'express';
import cors from 'cors';

// Funkcja bootstrap uruchamia serwer, zwracając Promise.
// Dzięki temu możemy wywołać .then(...) i .catch(...), unikając "floating promises".
async function bootstrap(): Promise<void> {
  const app = express();
  const PORT = process.env.PORT || 5000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Przykładowa trasa
  app.get('/api', (req: Request, res: Response) => {
    res.json({ message: 'Backend TypeScript działa poprawnie!' });
  });

  // Zwracamy Promise, który rozwiąże się po pomyślnym uruchomieniu serwera
  return new Promise<void>((resolve, reject) => {
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
