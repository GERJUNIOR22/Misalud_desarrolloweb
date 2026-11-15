import { HttpErrorResponse } from '@angular/common/http';

// Convierte un error HTTP en un mensaje comprensible para el usuario (Semana 13 y 14)
//  - No muestra detalles internos del servidor (trazas, SQL, rutas...)
//  - Los errores de regla de negocio (400, 404, 409) si traen un mensaje pensado para el usuario
export function mensajeDeError(err: HttpErrorResponse, porDefecto: string): string {
  switch (err.status) {
    case 0:
      return 'No hay conexion con el servidor. Verifica que el backend este encendido.';
    case 401:
      return 'Su sesion no es valida. Inicie sesion nuevamente.';
    case 403:
      return 'No tiene permisos para realizar esta operacion.';
    case 400:
    case 404:
    case 409:
      return err.error?.mensaje ?? porDefecto;
    default:
      return porDefecto;
  }
}
