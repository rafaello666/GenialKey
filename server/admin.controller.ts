import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Najpierw weryfikacja tokenu, potem ról
export class AdminController {

  @Get()
  @Roles('ADMIN') // Tylko admin
  findAll(@Request() req) {
    return {
      adminData: 'This is admin-only data',
      user: req.user,
    };
  },
}
