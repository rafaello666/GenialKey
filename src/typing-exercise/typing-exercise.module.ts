import { Module } from '@nestjs/common';
import { TypingExerciseService } from './service/typing-exercise.service';
import { TypingExerciseController } from './controller/typing-exercise.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],                   // Import modułu z PrismaService
  controllers: [TypingExerciseController],   // Rejestracja kontrolera
  providers: [TypingExerciseService]         // Rejestracja serwisu
})
export class TypingExerciseModule {}
