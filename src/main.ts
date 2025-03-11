import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Rejestracja ValidationPipe globalnie:
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,               // usuwa nieznane pola z żądania
      forbidNonWhitelisted: true,    // rzuca błąd, jeśli pola spoza DTO zostaną przesłane
      transform: true,               // automatyczna konwersja typów
    }),
  );

  await app.listen(3000);
}
bootstrap();
