import { Module } from '@nestjs/common';
import { UserService } from './user.service';
// Jeśli masz kontroler:
// import { UserController } from './user.controller';

@Module({
  // Jeśli masz kontroler, dodaj go do tablicy controllers
  controllers: [
    // UserController,
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
