import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Se muestra con la ruta comodin '**' cuando la URL no existe
@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink],
  templateUrl: './no-encontrado.html',
  styleUrl: './no-encontrado.scss',
})
export class NoEncontrado {}
