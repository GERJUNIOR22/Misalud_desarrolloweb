import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/auth';
import { AuthService } from '../services/auth.service';

// Deja entrar solo a ciertos roles. Se usa asi:  canActivate: [rolGuard('ADMIN')]
export const rolGuard =
  (...rolesPermitidos: Rol[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.estaAutenticado()) {
      return router.createUrlTree(['/login']);
    }

    const rol = auth.rol();
    return rol !== null && rolesPermitidos.includes(rol) ? true : router.createUrlTree(['/inicio']);
  };
