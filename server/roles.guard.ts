import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Pobierz z metadanych listę ról
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (!requiredRoles) {
      // Jeżeli endpoint nie ma zdefiniowanego @Roles(), to jest dostępny dla każdego (o ile przeszedł JWT)
      return true;
    }

    // Sprawdź użytkownika z requestu
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false;
    }

    // Sprawdź, czy rola usera znajduje się w requiredRoles
    return requiredRoles.includes(user.role);
  }
}
