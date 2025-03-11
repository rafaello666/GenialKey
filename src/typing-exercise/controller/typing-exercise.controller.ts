import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { TypingExerciseService } from '../service/typing-exercise.service';
import { CreateTypingExerciseDto } from '../dto/create-typing-exercise.dto';
import { UpdateTypingExerciseDto } from '../dto/update-typing-exercise.dto';

@Controller('typing-exercises')
export class TypingExerciseController {
  constructor(private readonly typingExerciseService: TypingExerciseService) {}

  // GET /typing-exercises
  @Get()
  findAll() {
    return this.typingExerciseService.findAll();
  }

  // GET /typing-exercises/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    // Używamy +id aby przekonwertować string na number
    return this.typingExerciseService.findOne(+id);
  }

  // POST /typing-exercises
  @Post()
  create(@Body() createDto: CreateTypingExerciseDto) {
    return this.typingExerciseService.create(createDto);
  }

  // PUT /typing-exercises/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateTypingExerciseDto) {
    return this.typingExerciseService.update(+id, updateDto);
  }

  // DELETE /typing-exercises/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.typingExerciseService.remove(+id);
  }
}
