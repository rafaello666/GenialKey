import { IsString, IsNotEmpty, MaxLength, IsInt } from 'class-validator';

export class CreateTypingExerciseDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;             // Tytuł ćwiczenia (wymagany, max 255 znaków)

  @IsNotEmpty()
  @IsString()
  text: string;              // Treść (tekst) ćwiczenia (wymagane)

  @IsNotEmpty()
  @IsInt()
  difficultyLevel: number;   // Poziom trudności (wymagany, liczba całkowita)
}
