import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Course } from '@prisma/client';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  createCourse(title: string, description?: string): Promise<Course> {
    return this.prisma.course.create({
      data: { title, description }
    });
  }

  findAllCourses(): Promise<Course[]> {
    return this.prisma.course.findMany({
      include: { lessons: true }
    });
  }

  findCourseById(id: number): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { id },
      include: { lessons: true }
    });
  }
}
