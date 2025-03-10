// src/users/users.controller.ts
import { Controller, Get, Post, Param, Body, Patch, ParseIntPipe, Delete } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './user.model'; // adjust path as needed

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() body: { username: string; password: string; role: 'ADMIN'; UserRole }) {
    const { username, password, role } = body;
    return this.usersService.createUser(username, password, role ?? UserRole.ADMIN),
  };

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { username?: string; password?: string, },
  ) {
    const { username, password, } = body;
    return this.usersService.updateUser(id, username, password);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteUser(id);
  }
}
