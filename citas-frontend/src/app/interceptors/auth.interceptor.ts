import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Se ejecuta en CADA peticion HTTP, antes de que salga hacia el backend
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;

  // El login no necesita token (todavia no hay sesion)
  const esLogin = req.url.includes('/auth/login');

  // Si hay token, se copia la peticion y se le agrega la cabecera Authorization
  const peticion =
    token && !esLogin ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 = el token no sirve o vencio (dura 1 hora): se cierra la sesion
      if (err.status === 401 && !esLogin) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
