import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';

// Marco de las paginas del PERSONAL (administrador y medicos): menu + contenido + pie.
// La ruta que lo usa esta protegida con authGuard, asi que aqui siempre hay una sesion.
@Component({
  selector: 'app-layout-personal',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './layout-personal.html',
  styleUrl: './layout-personal.scss',
})
export class LayoutPersonal {}
