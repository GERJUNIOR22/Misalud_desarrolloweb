import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../config/api';
import { EstadoPago, Pago, PagoRequest, ResumenPagos } from '../models/pago';

// Todas las llamadas HTTP de pagos. El interceptor agrega el token.
@Injectable({ providedIn: 'root' })
export class PagosService {
  private http = inject(HttpClient);
  private api = `${API_URL}/api/pagos`;

  // ADMIN: todos los pagos
  listar() {
    return this.http.get<Pago[]>(this.api);
  }

  // ADMIN: cuanto se cobro y cuanto falta
  resumen() {
    return this.http.get<ResumenPagos>(`${this.api}/resumen`);
  }

  // POST /api/pagos   (pago simulado; el monto lo calcula el servidor con el precio de la especialidad)
  pagar(datos: PagoRequest) {
    return this.http.post<Pago>(this.api, datos);
  }

  // PUT /api/pagos/{id}/estado?estado=COMPLETADO   (caja confirma o rechaza un pago pendiente)
  cambiarEstado(idPago: number, estado: EstadoPago) {
    return this.http.put<Pago>(`${this.api}/${idPago}/estado`, null, { params: { estado } });
  }
}
