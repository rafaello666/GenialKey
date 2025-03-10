import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { LessonService } from './lesson.service';

@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  create(@Body() body: { title: string; content: string; courseId: number }) {
    const { title, content, courseId } = body;
    return this.lessonService.createLesson(title, content, courseId);
  }

  @Get()
  findAll() {
    return this.lessonService.findAllLessons();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lessonService.findLessonById(id);
  }
}
