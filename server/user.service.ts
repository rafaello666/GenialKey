// src/users/users.service.ts

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, UserRole } from '@prisma.client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tworzy nowego użytkownika.
   * Hasło jest hashowane za pomocą bcrypt z saltRounds = 10.
   */
  async createUser(
    username: string,
    plainPassword: string,
    role: UserRole = UserRole.USER
  ): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) {
      throw new ConflictException('Username already taken');
    }

    // Hashowanie hasła
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

    return this.prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });
  }

  /**
   * Znajduje użytkownika po nazwie użytkownika (np. do logowania).
   * Zwraca pełen obiekt User (w tym passwordHash),
   * dlatego w kontrolerze/strategii trzeba uważać, by nie zwracać hasła "na zewnątrz".
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Znajduje użytkownika po ID.
   */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Prosta aktualizacja nazwy użytkownika lub hasła.
   * Jeśli chcesz umożliwić zmianę hasła, zhashuj je ponownie.
   */
  async updateUser(id: number, username?: string, newPassword?: string): Promise<User> {
    // Wczytanie użytkownika
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const dataToUpdate: Partial<User> = {};
    if (username) dataToUpdate.username = username;
    if (newPassword) {
      const saltRounds = 10;
      dataToUpdate.passwordHash = await bcrypt.hash(newPassword, saltRounds);
    }

    return this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  /**
   * Usunięcie użytkownika.
   */
  async deleteUser(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}

