import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Footer } from '../footer/footer';

// Marco de las paginas del PERSONAL (administrador y medicos): barra lateral + barra superior + contenido.
// La ruta que lo usa esta protegida con authGuard, asi que aqui siempre hay una sesion.
@Component({
  selector: 'app-layout-personal',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Footer],
  templateUrl: './layout-personal.html',
  styleUrl: './layout-personal.scss',
})
export class LayoutPersonal {
  auth = inject(AuthService);
  private router = inject(Router);

  sidebarAbierto = signal(true);
  menuMovilAbierto = signal(false);

  etiquetaRol = computed(() => {
    switch (this.auth.rol()) {
      case 'ADMIN':
        return 'Administrador Principal';
      case 'MEDICO':
        return 'Médico';
      default:
        return 'Personal';
    }
  });

  alternarSidebar(): void {
    if (window.innerWidth <= 900) {
      this.menuMovilAbierto.update((v) => !v);
    } else {
      this.sidebarAbierto.update((v) => !v);
    }
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
