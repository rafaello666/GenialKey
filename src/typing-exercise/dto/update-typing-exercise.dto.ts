import { PartialType } from '@nestjs/mapped-types';
import { CreateTypingExerciseDto } from './create-typing-exercise.dto';
import { IsInt } from 'class-validator';

export class UpdateTypingExerciseDto extends PartialType(CreateTypingExerciseDto) {
  // Wszystkie pola z CreateDto stają się opcjonalne.
  // Dodatkowo można doprecyzować walidacje dla aktualizacji, np.:
  @IsInt()
  difficultyLevel?: number;
}
