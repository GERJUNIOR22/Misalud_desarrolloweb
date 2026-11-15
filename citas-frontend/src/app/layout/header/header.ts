import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  auth = inject(AuthService);
  private router = inject(Router);

  nombreSistema = 'Mi salud · Personal';

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

