import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Componente raiz: solo el hueco donde el Router pone el marco que corresponde
//   - LayoutPublico  -> portada, reserva en linea y consulta de cita (sin login)
//   - LayoutPersonal -> sistema interno (requiere sesion)
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
