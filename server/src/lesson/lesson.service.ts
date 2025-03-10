import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Lesson } from '@prisma/client';

@Injectable()
export class LessonService {
  constructor(private prisma: PrismaService) {}

  createLesson(title: string, content: string, courseId: number): Promise<Lesson> {
    return this.prisma.lesson.create({
      data: { title, content, courseId }
    });
  }

  findAllLessons(): Promise<Lesson[]> {
    return this.prisma.lesson.findMany({
      include: { course: true, typingResults: true }
    });
  }

  findLessonById(id: number): Promise<Lesson | null> {
    return this.prisma.lesson.findUnique({
      where: { id },
      include: { course: true, typingResults: true }
    });
  }
}
