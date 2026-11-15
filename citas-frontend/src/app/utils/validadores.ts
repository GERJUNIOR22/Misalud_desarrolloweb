import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Fecha de hoy como AAAA-MM-DD (hora local, no UTC)
export function hoyISO(): string {
  return new Date().toLocaleDateString('en-CA');
}

// Validador personalizado (Semana 13): devuelve null si es valido, o un objeto con el error
// Regla del negocio: no se reserva en una fecha pasada
export function fechaNoPasada(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) return null; // "obligatorio" lo valida Validators.required
  return valor >= hoyISO() ? null : { fechaPasada: true };
}

// Validador de GRUPO: la hora de fin debe ser posterior a la de inicio (igual que el backend)
export function horaFinPosterior(inicio: string, fin: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const desde = grupo.get(inicio)?.value as string;
    const hasta = grupo.get(fin)?.value as string;
    if (!desde || !hasta) return null; // "obligatorio" lo valida Validators.required
    return hasta > desde ? null : { rangoInvalido: true }; // "08:00" < "13:00" compara bien como texto
  };
}

// Fecha de nacimiento: no puede ser hoy ni futura, ni de hace mas de 120 anios
export function fechaNacimientoValida(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) return null; // "obligatorio" lo valida Validators.required
  if (valor >= hoyISO()) return { fechaFutura: true };
  const edad = calcularEdad(valor);
  return edad !== null && edad > 120 ? { fechaMuyAntigua: true } : null;
}

// Edad en anios cumplidos a partir de AAAA-MM-DD (null si no hay fecha)
export function calcularEdad(fechaNacimiento: string | null | undefined): number | null {
  if (!fechaNacimiento) return null;
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - anio;
  // Si todavia no llego su cumpleanios este anio, resta uno
  if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) {
    edad--;
  }
  return edad >= 0 ? edad : null;
}
