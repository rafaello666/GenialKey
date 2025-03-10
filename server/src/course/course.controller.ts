import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CourseService } from './course.service';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  create(@Body() body: { title: string; description?: string }) {
    const { title, description } = body;
    return this.courseService.createCourse(title, description);
  }

  @Get()
  findAll() {
    return this.courseService.findAllCourses();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.findCourseById(id);
  }
}
