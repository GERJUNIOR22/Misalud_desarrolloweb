import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Footer } from '../footer/footer';

// Marco de las paginas PUBLICAS (portada, reserva en linea, consulta de cita): sin menu del sistema.
@Component({
  selector: 'app-layout-publico',
  imports: [RouterLink, RouterOutlet, Footer],
  templateUrl: './layout-publico.html',
  styleUrl: './layout-publico.scss',
})
export class LayoutPublico {
  auth = inject(AuthService);
}
