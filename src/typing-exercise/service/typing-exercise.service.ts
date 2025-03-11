import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTypingExerciseDto } from '../dto/create-typing-exercise.dto';
import { UpdateTypingExerciseDto } from '../dto/update-typing-exercise.dto';

@Injectable()
export class TypingExerciseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // Pobiera wszystkie rekordy TypingExercise z bazy
    return this.prisma.typingExercise.findMany();
  }

  async findOne(id: number) {
    return this.prisma.typingExercise.findUnique({
      where: { id: id }
    });
  }

  async create(createDto: CreateTypingExerciseDto) {
    // Tworzy nowy rekord na podstawie danych z DTO
    return this.prisma.typingExercise.create({
      data: createDto,
    });
  }

  async update(id: number, updateDto: UpdateTypingExerciseDto) {
    return this.prisma.typingExercise.update({
      where: { id: id },
      data: updateDto,
    });
  }

  async remove(id: number) {
    return this.prisma.typingExercise.delete({
      where: { id: id }
    });
  }
}
