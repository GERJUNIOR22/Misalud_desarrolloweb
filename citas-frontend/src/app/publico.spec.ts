import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

// Pruebas de la parte PUBLICA (pacientes sin cuenta) y del acceso del personal
const API = 'http://localhost:8080';

function escribir(el: HTMLElement, selector: string, valor: string, evento = 'input'): void {
  const campo = el.querySelector(selector) as HTMLInputElement;
  campo.value = valor;
  campo.dispatchEvent(new Event(evento));
  campo.dispatchEvent(new Event('blur'));
}

function enDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toLocaleDateString('en-CA');
}

const ESPECIALIDADES = [
  { idEspecialidad: 1, nombre: 'Cardiologia', descripcion: null, precio: 120 },
  { idEspecialidad: 2, nombre: 'Pediatria', descripcion: null, precio: 80 },
];
const DOCTORES = [
  { colegiatura: '045821', nombres: 'Carlos', apellidos: 'Ramirez', idEspecialidad: 1, especialidad: 'Cardiologia' },
];
const RESERVA = {
  codigoCita: 'CIT-00007',
  estadoCita: 'PENDIENTE',
  fecha: '2026-11-20',
  hora: '08:30:00',
  horaFin: '09:00:00',
  doctor: 'Dr. Carlos Ramirez',
  especialidad: 'Cardiologia',
  paciente: 'Maria Lopez',
  dniPaciente: '70112233',
  monto: 120,
  metodoPago: 'YAPE',
  estadoPago: 'COMPLETADO',
  numeroOperacion: 'OP-20261115',
};

function consulta(codigo: string) {
  return (r: { url: string }) => r.url === `${API}/api/publico/citas/${codigo}`;
}

describe('Parte publica (pacientes sin cuenta) y acceso del personal', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => sessionStorage.clear());

  // ---------- portada ----------
  it('la portada es publica: Mi salud, Reservar cita y Soy trabajador, sin el menu del personal', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    const el = harness.routeNativeElement as HTMLElement;

    expect(TestBed.inject(Router).url).toBe('/');
    expect(el.textContent).toContain('Mi salud');
    expect(el.textContent).toContain('Reserva tu cita médica en un solo lugar');
    expect(el.querySelector('a.reservar')?.getAttribute('href')).toBe('/reservar');
    expect(el.querySelector('a.acceso')?.textContent).toContain('Soy trabajador');
    expect(el.querySelector('a.acceso')?.getAttribute('href')).toBe('/login');
    expect(el.querySelector('app-header')).toBeNull(); // el menu del sistema no se ve
  });

  it('si el personal ya inicio sesion, la portada ofrece "Ir al sistema"', async () => {
    sessionStorage.setItem('sesion', JSON.stringify({ token: 't', correo: 'a@a.pe', rol: 'ADMIN' }));
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    expect(harness.routeNativeElement?.querySelector('a.acceso')?.textContent).toContain('Ir al sistema');
  });

  it('las paginas publicas se abren sin sesion', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/reservar');
    http.expectOne(`${API}/api/publico/especialidades`).flush(ESPECIALIDADES);
    expect(TestBed.inject(Router).url).toBe('/reservar');

    await harness.navigateByUrl('/mi-cita');
    expect(TestBed.inject(Router).url).toBe('/mi-cita');
  });

  it('las paginas del personal redirigen al login si no hay sesion', async () => {
    const harness = await RouterTestingHarness.create();
    for (const ruta of ['/inicio', '/citas', '/pagos', '/horarios', '/admin/usuarios']) {
      await harness.navigateByUrl(ruta);
      expect(TestBed.inject(Router).url).toBe('/login');
    }
  });

  it('la portada valida y lleva a /mi-cita con el codigo y el DNI (sin ponerlos en la URL)', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    const el = harness.routeNativeElement as HTMLElement;

    (el.querySelector('.consultar') as HTMLButtonElement).click();
    harness.detectChanges();
    expect(el.textContent).toContain('Código con el formato');
    expect(TestBed.inject(Router).url).toBe('/');

    escribir(el, 'input[formControlName="codigo"]', 'cit-00007');
    escribir(el, 'input[formControlName="dni"]', '70112233');
    (el.querySelector('.consultar') as HTMLButtonElement).click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/mi-cita'); // ni el codigo ni el DNI van en la URL
    const peticion = http.expectOne(consulta('CIT-00007'));
    expect(peticion.request.params.get('dni')).toBe('70112233');
    peticion.flush(RESERVA);
    harness.detectChanges();

    expect(el.textContent).toContain('Tu cita');
    expect(el.textContent).toContain('CIT-00007');
    expect(el.textContent).toContain('Maria Lopez');
  });

  // ---------- reserva en linea ----------
  async function abrirReservaEnLinea() {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/reservar');
    http.expectOne(`${API}/api/publico/especialidades`).flush(ESPECIALIDADES);
    harness.detectChanges();
    return { harness, el: harness.routeNativeElement as HTMLElement };
  }

  // Deja el formulario completo, listo para pulsar "Pagar y reservar"
  async function llenarReserva(harness: RouterTestingHarness, el: HTMLElement): Promise<string> {
    const fecha = enDias(3);

    escribir(el, '#especialidad', '1', 'change');
    const pedido = http.expectOne((r) => r.url === `${API}/api/publico/doctores`);
    expect(pedido.request.params.get('idEspecialidad')).toBe('1');
    pedido.flush(DOCTORES);
    harness.detectChanges();

    escribir(el, '#doctor', '045821', 'change');
    escribir(el, '#fecha', fecha);
    const disponibilidad = http.expectOne((r) => r.url === `${API}/api/publico/disponibilidad`);
    expect(disponibilidad.request.params.get('colegiatura')).toBe('045821');
    expect(disponibilidad.request.params.get('fecha')).toBe(fecha);
    disponibilidad.flush([
      { hora: '08:00:00', horaFin: '08:30:00', disponible: false },
      { hora: '08:30:00', horaFin: '09:00:00', disponible: true },
    ]);
    harness.detectChanges();

    const horas = el.querySelectorAll('.hora');
    expect((horas[0] as HTMLButtonElement).disabled).toBe(true); // ocupado
    (horas[1] as HTMLButtonElement).click();

    escribir(el, '#dni', '70112233');
    escribir(el, '#telefono', '912345678');
    escribir(el, '#nombres', 'Maria');
    escribir(el, '#apellidos', 'Lopez');
    escribir(el, '#motivo', 'Dolor de pecho');
    (el.querySelectorAll('.metodo')[1] as HTMLButtonElement).click(); // YAPE
    harness.detectChanges();
    return fecha;
  }

  it('el paciente solo ve metodos en linea (no hay efectivo) y el total sale de la especialidad', async () => {
    const { harness, el } = await abrirReservaEnLinea();

    const metodos = Array.from(el.querySelectorAll('.metodo')).map((b) => b.textContent?.trim());
    expect(metodos).toEqual(['TARJETA', 'YAPE', 'PLIN', 'TRANSFERENCIA']);

    escribir(el, '#especialidad', '1', 'change');
    http.expectOne((r) => r.url === `${API}/api/publico/doctores`).flush(DOCTORES);
    harness.detectChanges();
    expect(el.querySelector('.total')?.textContent).toContain('S/ 120.00');
  });

  it('reserva y paga en un solo paso: POST /api/publico/reservas sin monto, y muestra la confirmacion', async () => {
    const { harness, el } = await abrirReservaEnLinea();
    const fecha = await llenarReserva(harness, el);

    (el.querySelector('.pagar') as HTMLButtonElement).click();
    const post = http.expectOne(`${API}/api/publico/reservas`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      dni: '70112233',
      nombres: 'Maria',
      apellidos: 'Lopez',
      telefono: '912345678',
      colegiaturaDoctor: '045821',
      fecha,
      hora: '08:30:00',
      motivo: 'Dolor de pecho',
      metodo: 'YAPE',
    }); // no viaja el monto: lo calcula el servidor
    post.flush(RESERVA, { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/mi-cita');
    http.expectOne(consulta('CIT-00007')).flush(RESERVA);
    harness.detectChanges();

    expect(el.textContent).toContain('Reserva confirmada');
    expect(el.textContent).toContain('CIT-00007');
    expect(el.textContent).toContain('S/ 120.00');
    expect(el.textContent).toContain('COMPLETADO');
  });

  it('no envia la reserva si faltan datos y marca cada campo', async () => {
    const { harness, el } = await abrirReservaEnLinea();

    escribir(el, '#dni', '123');
    (el.querySelector('.pagar') as HTMLButtonElement).click();
    harness.detectChanges();

    http.expectNone(`${API}/api/publico/reservas`);
    expect(el.textContent).toContain('Revise los campos señalados');
    expect(el.textContent).toContain('El DNI debe tener 8 dígitos');
    expect(el.textContent).toContain('Seleccione una especialidad');
    expect(el.textContent).toContain('Seleccione un método de pago');
  });

  it('si el horario se ocupo (400) muestra el mensaje, no cobra y vuelve a consultar los horarios', async () => {
    const { harness, el } = await abrirReservaEnLinea();
    await llenarReserva(harness, el);

    (el.querySelector('.pagar') as HTMLButtonElement).click();
    http
      .expectOne(`${API}/api/publico/reservas`)
      .flush({ mensaje: 'El doctor ya tiene una cita en ese horario' }, { status: 400, statusText: 'Bad Request' });
    http.expectOne((r) => r.url === `${API}/api/publico/disponibilidad`).flush([]);
    harness.detectChanges();

    expect(el.textContent).toContain('El doctor ya tiene una cita en ese horario');
    expect(TestBed.inject(Router).url).toBe('/reservar'); // sigue en la reserva
  });

  // ---------- consulta de una cita ----------
  it('mi-cita: consulta manual con codigo y DNI', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/mi-cita');
    const el = harness.routeNativeElement as HTMLElement;

    (el.querySelector('.consultar') as HTMLButtonElement).click();
    harness.detectChanges();
    http.expectNone((r) => r.url.startsWith(`${API}/api/publico/citas`));
    expect(el.textContent).toContain('formato CIT-00007');

    escribir(el, '#codigo', 'CIT-00007');
    escribir(el, '#dni', '70112233');
    (el.querySelector('.consultar') as HTMLButtonElement).click();
    http.expectOne(consulta('CIT-00007')).flush(RESERVA);
    harness.detectChanges();

    expect(el.textContent).toContain('Tu cita');
    expect(el.textContent).not.toContain('Reserva confirmada');
    expect(el.textContent).toContain('Dr. Carlos Ramirez');
  });

  it('mi-cita: si el codigo y el DNI no coinciden muestra el mensaje del backend (404)', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/mi-cita');
    const el = harness.routeNativeElement as HTMLElement;

    escribir(el, '#codigo', 'CIT-00007');
    escribir(el, '#dni', '71234567');
    (el.querySelector('.consultar') as HTMLButtonElement).click();
    http
      .expectOne(consulta('CIT-00007'))
      .flush({ mensaje: 'No se encontro una cita con ese codigo y DNI' }, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();

    expect(el.textContent).toContain('No se encontro una cita con ese codigo y DNI');
  });

  // ---------- acceso del personal ----------
  it('el login es solo del personal: no ofrece registro', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');
    const texto = harness.routeNativeElement?.textContent ?? '';

    expect(texto).toContain('Acceso del personal');
    expect(texto).toContain('No hay registro público');
    expect(texto).not.toContain('Regístrate');
    expect(harness.routeNativeElement?.querySelector('a[href="/"]')?.textContent).toContain('Volver a Mi salud');
  });

  it('el personal entra: POST /auth/login, guarda la sesion y va al inicio', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');
    const el = harness.routeNativeElement as HTMLElement;

    escribir(el, '#correo', 'admin@clinica.pe');
    escribir(el, '#password', 'clave12345');
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();

    const post = http.expectOne(`${API}/auth/login`);
    expect(post.request.body).toEqual({ correo: 'admin@clinica.pe', password: 'clave12345' });
    post.flush({ token: 'jwt-de-prueba', correo: 'admin@clinica.pe', rol: 'ADMIN' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/inicio');
    expect(JSON.parse(sessionStorage.getItem('sesion') ?? '{}').rol).toBe('ADMIN');
  });

  it('una cuenta que no es del personal recibe 403: se muestra el mensaje y no hay sesion', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');
    const el = harness.routeNativeElement as HTMLElement;

    escribir(el, '#correo', 'paciente@correo.com');
    escribir(el, '#password', 'clave12345');
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    http
      .expectOne(`${API}/auth/login`)
      .flush(
        { mensaje: 'El acceso es solo para el personal de la clinica. Los pacientes reservan desde la pagina principal' },
        { status: 403, statusText: 'Forbidden' },
      );
    harness.detectChanges();

    expect(el.textContent).toContain('solo para el personal');
    expect(sessionStorage.getItem('sesion')).toBeNull();
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('credenciales incorrectas (401) muestran el mensaje del backend', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');
    const el = harness.routeNativeElement as HTMLElement;

    escribir(el, '#correo', 'admin@clinica.pe');
    escribir(el, '#password', 'mala');
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    http
      .expectOne(`${API}/auth/login`)
      .flush({ mensaje: 'Correo o contraseña incorrectos' }, { status: 401, statusText: 'Unauthorized' });
    harness.detectChanges();

    expect(el.textContent).toContain('Correo o contraseña incorrectos');
  });

  // ---------- el marco del personal ----------
  it('el personal ve su menu segun el rol (el administrador tiene Caja y Usuarios; el medico no)', async () => {
    const menu = async (rol: 'ADMIN' | 'MEDICO') => {
      sessionStorage.setItem('sesion', JSON.stringify({ token: 't', correo: 'a@a.pe', rol }));
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [App],
        providers: [provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
      }).compileComponents();
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/inicio');
      const el = harness.routeNativeElement as HTMLElement;
      expect(el.querySelector('app-header')).not.toBeNull();
      expect(el.textContent).toContain('Mi salud · Personal');
      return Array.from(el.querySelectorAll('app-header nav a')).map((a) => a.textContent?.trim());
    };

    const admin = await menu('ADMIN');
    expect(admin).toEqual(expect.arrayContaining(['Caja', 'Usuarios', 'Especialidades', 'Doctores', 'Pacientes']));

    const medico = await menu('MEDICO');
    expect(medico).toEqual(['Inicio', 'Mis citas', 'Reservar cita', 'Mis horarios']);
  });
});
