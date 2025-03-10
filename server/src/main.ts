import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty()
  title: string;

  @IsOptional()
  description?: string;
}
@Post()
create(@Body() dto: CreateCourseDto) {
  return this.courseService.createCourse(dto.title, dto.description);
}
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
app.enableCors();
app.use(helmet());
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();

