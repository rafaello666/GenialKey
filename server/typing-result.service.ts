import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { TypingResult } from '@prisma/client';

@Injectable()
export class TypingResultService {
  constructor(private prisma: PrismaService) {}

  recordResult(
    userId: number,
    lessonId: number,
    wpm: number,
    accuracy: number
  ): Promise<TypingResult> {
    return this.prisma.typingResult.create({
      data: { userId, lessonId, wpm, accuracy }
    });
  }

  getResultsForLesson(lessonId: number): Promise<TypingResult[]> {
    return this.prisma.typingResult.findMany({
      where: { lessonId },
      include: { user: true }
    });
  }

  getUserResults(userId: number): Promise<TypingResult[]> {
    return this.prisma.typingResult.findMany({
      where: { userId },
      include: { lesson: true }
    });
  }
}
