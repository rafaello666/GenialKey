import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaService } from './prisma.service';
import { CourseModule } from './course/course.module';
import { LessonModule } from './lesson/lesson.module';
import { TypingResultModule } from './typing-result/typing-result.module';
import { ProfileController } from './profile.controller';
import { AdminController } from './admin.controller';

@Module({
  imports: [CourseModule, LessonModule, TypingResultModule],
  imports: [ConfigModule.forRoot({ isGlobal: true }),
  imports: [UsersModule],
  imports: [ThrottlerModule.forRoot({ ttl: 60, limit: 10}),
  JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
      imports: [UsersModule, AuthModule],
    }),
  ],
],
  controllers: [ProfileController, AdminController],
  providers: [PrismaService],
});
export class AppModule {}
