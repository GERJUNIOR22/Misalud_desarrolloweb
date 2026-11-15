import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AuthService } from './services/auth.service';
import { Cita, EstadoCita } from './models/cita';

const API = 'http://localhost:8080';

function iniciarSesion(rol: 'ADMIN' | 'MEDICO' = 'ADMIN'): void {
  sessionStorage.setItem('sesion', JSON.stringify({ token: 'token-de-prueba', correo: 'a@a.pe', rol }));
}

// Una cita como la devuelve el backend
function citaDe(codigo: string, estado: EstadoCita = 'PENDIENTE'): Cita {
  return {
    codigo,
    doctor: {
      colegiatura: '045821',
      nombres: 'Carlos',
      apellidos: 'Ramirez',
      especialidad: { nombre: 'Cardiologia', precio: 120 },
    },
    paciente: { dni: '71234567', nombres: 'Ana', apellidos: 'Gonzales' },
    fecha: '2026-11-20',
    hora: '09:00:00',
    horaFin: '09:30:00',
    duracionMinutos: 30,
    motivo: 'Chequeo',
    estado,
    observacion: null,
  };
}

// Escribe un valor en un input/select/textarea y avisa a Angular (como si lo hiciera el usuario)
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
  { idEspecialidad: 1, nombre: 'Cardiologia', descripcion: null, precio: 120, activo: true },
  { idEspecialidad: 2, nombre: 'Pediatria', descripcion: null, precio: 80, activo: true },
];
const DOCTORES = [
  { colegiatura: '045821', nombres: 'Carlos', apellidos: 'Ramirez', telefono: null, especialidad: ESPECIALIDADES[0] },
  { colegiatura: '052347', nombres: 'Lucia', apellidos: 'Fernandez', telefono: null, especialidad: ESPECIALIDADES[1] },
];

describe('App con rutas, API y seguridad', () => {
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

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  // ---------- guards ----------
  it('sin sesion, /citas redirige a /login (authGuard)', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas');
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('una URL inexistente muestra la pagina 404', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/no-existe');
    expect(harness.routeNativeElement?.textContent).toContain('404');
  });

  // ---------- lista de citas desde la API ----------
  it('el admin carga TODAS las citas (GET /api/citas)', async () => {
    iniciarSesion('ADMIN');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas');

    http.expectOne(`${API}/api/citas`).flush([citaDe('CIT-00001')]);
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('Todas las citas');
    expect(harness.routeNativeElement?.querySelectorAll('app-cita-card').length).toBe(1);
  });

  it('muestra un mensaje claro si el servidor falla (500) o no hay permiso (403)', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas');
    http
      .expectOne(`${API}/api/citas/mis-citas`)
      .flush('trace interna', { status: 500, statusText: 'Server Error' });
    harness.detectChanges();

    const texto = harness.routeNativeElement?.textContent ?? '';
    expect(texto).toContain('No se pudieron cargar las citas');
    expect(texto).not.toContain('trace interna'); // no se exponen detalles internos

    (harness.routeNativeElement?.querySelector('.reintentar') as HTMLButtonElement).click();
    http
      .expectOne(`${API}/api/citas/mis-citas`)
      .flush({ mensaje: 'x' }, { status: 403, statusText: 'Forbidden' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No tiene permisos');
  });

  it('cancelar una cita hace PUT con estado CANCELADA y actualiza la tarjeta (ADMIN)', async () => {
    iniciarSesion('ADMIN');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas');
    http.expectOne(`${API}/api/citas`).flush([citaDe('CIT-00001')]);
    harness.detectChanges();

    (harness.routeNativeElement?.querySelector('.btn-cancelar') as HTMLButtonElement).click();
    const put = http.expectOne(`${API}/api/citas/CIT-00001/estado`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.estado).toBe('CANCELADA');
    put.flush(citaDe('CIT-00001', 'CANCELADA'));
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('.estado')?.textContent).toContain('CANCELADA');
    expect(harness.routeNativeElement?.textContent).toContain('fue cancelada');
  });

  // ---------- acciones del medico ----------
  it('el MEDICO ve Confirmar/Rechazar en una cita pendiente y Completar en una confirmada', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas');
    http
      .expectOne(`${API}/api/citas/mis-citas`)
      .flush([citaDe('CIT-00001', 'PENDIENTE'), citaDe('CIT-00002', 'CONFIRMADA'), citaDe('CIT-00003', 'COMPLETADA')]);
    harness.detectChanges();

    const tarjetas = harness.routeNativeElement?.querySelectorAll('app-cita-card') as NodeListOf<HTMLElement>;
    const textos = (i: number) =>
      Array.from(tarjetas[i].querySelectorAll('.btn-accion')).map((b) => b.textContent?.trim());

    expect(textos(0)).toEqual(['Confirmar', 'Rechazar']);
    expect(textos(1)).toEqual(['Marcar como completada']);
    expect(textos(2)).toEqual([]); // una cita completada ya no se gestiona
    expect(tarjetas[0].querySelector('.btn-cancelar')).toBeNull(); // el medico no cancela
  });

  it('el ADMIN no ve Confirmar/Rechazar/Completar en la tarjeta (lo hace en el detalle)', async () => {
    iniciarSesion('ADMIN');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas');
    http.expectOne(`${API}/api/citas`).flush([citaDe('CIT-00001', 'PENDIENTE')]);
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('.btn-accion')).toBeNull();
  });

  it('Confirmar hace PUT con estado CONFIRMADA y actualiza la tarjeta', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas');
    http.expectOne(`${API}/api/citas/mis-citas`).flush([citaDe('CIT-00001', 'PENDIENTE')]);
    harness.detectChanges();

    (harness.routeNativeElement?.querySelector('.btn-accion[data-estado="CONFIRMADA"]') as HTMLButtonElement).click();
    const put = http.expectOne(`${API}/api/citas/CIT-00001/estado`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.estado).toBe('CONFIRMADA');
    put.flush(citaDe('CIT-00001', 'CONFIRMADA'));
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('.estado')?.textContent).toContain('CONFIRMADA');
    expect(harness.routeNativeElement?.textContent).toContain('fue confirmada');
    // ahora la unica accion posible es completarla
    expect(harness.routeNativeElement?.querySelector('.btn-accion')?.textContent).toContain('completada');
  });

  it('el detalle permite completar con una observacion', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas/CIT-00002');
    http.expectOne(`${API}/api/citas/CIT-00002`).flush(citaDe('CIT-00002', 'CONFIRMADA'));
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    escribir(el, '#observacion', 'Presion normal, volver en 3 meses');
    (el.querySelector('.btn-accion[data-estado="COMPLETADA"]') as HTMLButtonElement).click();

    const put = http.expectOne(`${API}/api/citas/CIT-00002/estado`);
    expect(put.request.body).toEqual({
      estado: 'COMPLETADA',
      observacion: 'Presion normal, volver en 3 meses',
    });
    put.flush({ ...citaDe('CIT-00002', 'COMPLETADA'), observacion: 'Presion normal, volver en 3 meses' });
    harness.detectChanges();

    expect(el.textContent).toContain('fue completada');
    expect(el.textContent).toContain('Presion normal, volver en 3 meses');
    expect(el.querySelector('.btn-accion')).toBeNull(); // ya no hay mas acciones
  });

  it('no envia el cambio si la observacion pasa de 300 caracteres', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas/CIT-00002');
    http.expectOne(`${API}/api/citas/CIT-00002`).flush(citaDe('CIT-00002', 'CONFIRMADA'));
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    escribir(el, '#observacion', 'x'.repeat(301));
    (el.querySelector('.btn-accion') as HTMLButtonElement).click();
    harness.detectChanges();

    http.expectNone(`${API}/api/citas/CIT-00002/estado`);
    expect(el.textContent).toContain('no puede pasar de 300 caracteres');
  });

  it('muestra el mensaje del backend si el cambio de estado no esta permitido (400)', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas/CIT-00001');
    http.expectOne(`${API}/api/citas/CIT-00001`).flush(citaDe('CIT-00001', 'PENDIENTE'));
    harness.detectChanges();

    (harness.routeNativeElement?.querySelector('.btn-accion') as HTMLButtonElement).click();
    http
      .expectOne(`${API}/api/citas/CIT-00001/estado`)
      .flush({ mensaje: 'No se puede pasar de PENDIENTE a CONFIRMADA' }, { status: 400, statusText: 'Bad Request' });
    harness.detectChanges();

    expect(harness.routeNativeElement?.textContent).toContain('No se puede pasar de PENDIENTE a CONFIRMADA');
  });

  // ---------- pagos ----------
  function pagoDe(id: number, codigoCita: string, estado: 'PENDIENTE' | 'COMPLETADO' | 'RECHAZADO' = 'COMPLETADO') {
    return {
      idPago: id,
      codigoCita,
      dniPaciente: '71234567',
      paciente: 'Ana Gonzales',
      monto: 120,
      metodo: 'YAPE' as const,
      estado,
      fechaPago: '2026-10-12T00:45:26',
      numeroOperacion: estado === 'COMPLETADO' ? 'OP-1' : null,
    };
  }

  it('el ADMIN ve la caja: resumen y puede confirmar un pago pendiente', async () => {
    iniciarSesion('ADMIN');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/pagos');
    http.expectOne(`${API}/api/pagos`).flush([pagoDe(7, 'CIT-00009', 'PENDIENTE')]);
    http.expectOne(`${API}/api/pagos/resumen`).flush({ cobrado: 130, porCobrar: 120 });
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    expect(el.textContent).toContain('Caja');
    expect(el.textContent).toContain('S/ 130.00');
    expect(el.textContent).toContain('S/ 120.00');

    (el.querySelector('.confirmar') as HTMLButtonElement).click();
    const put = http.expectOne((r) => r.url === `${API}/api/pagos/7/estado`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.params.get('estado')).toBe('COMPLETADO');
    put.flush(pagoDe(7, 'CIT-00009', 'COMPLETADO'));
    http.expectOne(`${API}/api/pagos/resumen`).flush({ cobrado: 250, porCobrar: 0 }); // totales actualizados
    harness.detectChanges();

    expect(el.textContent).toContain('confirmado');
    expect(el.textContent).toContain('S/ 250.00');
    expect(el.querySelector('.confirmar')).toBeNull();
  });

  async function abrirCaja(pagos: ReturnType<typeof pagoDe>[], citas: Cita[]) {
    iniciarSesion('ADMIN');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/pagos');
    http.expectOne(`${API}/api/pagos`).flush(pagos);
    http.expectOne(`${API}/api/pagos/resumen`).flush({ cobrado: 0, porCobrar: 0 });
    http.expectOne(`${API}/api/citas`).flush(citas);
    harness.detectChanges();
    return { harness, el: harness.routeNativeElement as HTMLElement };
  }

  it('caja: lista solo las citas COMPLETADAS que no tienen cobro', async () => {
    const { el } = await abrirCaja(
      [pagoDe(1, 'CIT-00002', 'COMPLETADO'), pagoDe(2, 'CIT-00004', 'RECHAZADO')],
      [
        citaDe('CIT-00001', 'COMPLETADA'), // sin pago -> aparece
        citaDe('CIT-00002', 'COMPLETADA'), // ya cobrada -> no aparece
        citaDe('CIT-00003', 'CONFIRMADA'), // aun no se completa -> no aparece
        citaDe('CIT-00004', 'COMPLETADA'), // su pago fue rechazado -> vuelve a aparecer
      ],
    );

    const filas = Array.from(el.querySelectorAll('.sin-cobro .cobro')).map((tr) => tr.textContent);
    expect(filas.length).toBe(2);
    expect(filas[0]).toContain('CIT-00001');
    expect(filas[1]).toContain('CIT-00004');
  });

  it('caja: registra el cobro en efectivo y lo confirma en el mismo paso', async () => {
    const { harness, el } = await abrirCaja([], [citaDe('CIT-00001', 'COMPLETADA')]);

    // metodo EFECTIVO (por defecto) y casilla "Confirmar" marcada (por defecto)
    expect((el.querySelector('.sin-cobro select') as HTMLSelectElement).value).toBe('EFECTIVO');
    expect((el.querySelector('.sin-cobro input[type="checkbox"]') as HTMLInputElement).checked).toBe(true);

    (el.querySelector('.cobrar') as HTMLButtonElement).click();
    const post = http.expectOne(`${API}/api/pagos`);
    expect(post.request.body).toEqual({ codigoCita: 'CIT-00001', metodo: 'EFECTIVO' }); // sin monto
    post.flush({ ...pagoDe(7, 'CIT-00001', 'PENDIENTE'), metodo: 'EFECTIVO' }, { status: 201, statusText: 'Created' });

    // el efectivo queda PENDIENTE y se confirma enseguida
    const put = http.expectOne((r) => r.url === `${API}/api/pagos/7/estado`);
    expect(put.request.params.get('estado')).toBe('COMPLETADO');
    put.flush({ ...pagoDe(7, 'CIT-00001', 'COMPLETADO'), metodo: 'EFECTIVO' });
    http.expectOne(`${API}/api/pagos/resumen`).flush({ cobrado: 120, porCobrar: 0 });
    harness.detectChanges();

    expect(el.textContent).toContain('registrado y confirmado');
    expect(el.textContent).toContain('No hay citas completadas pendientes de cobro');
    expect(el.textContent).toContain('S/ 120.00');
  });

  it('caja: si se desmarca "Confirmar", el efectivo queda PENDIENTE para confirmarlo despues', async () => {
    const { harness, el } = await abrirCaja([], [citaDe('CIT-00001', 'COMPLETADA')]);

    (el.querySelector('.sin-cobro input[type="checkbox"]') as HTMLInputElement).click(); // desmarca
    (el.querySelector('.cobrar') as HTMLButtonElement).click();
    http
      .expectOne(`${API}/api/pagos`)
      .flush(pagoDe(7, 'CIT-00001', 'PENDIENTE'), { status: 201, statusText: 'Created' });
    http.expectNone((r) => r.url === `${API}/api/pagos/7/estado`);
    http.expectOne(`${API}/api/pagos/resumen`).flush({ cobrado: 0, porCobrar: 120 });
    harness.detectChanges();

    expect(el.textContent).toContain('confirmelo cuando reciba el dinero');
    expect(el.querySelector('.confirmar')).not.toBeNull(); // aparece el boton Confirmar de la tabla de pagos
  });

  it('caja: con YAPE no hace falta confirmar (el backend lo deja COMPLETADO)', async () => {
    const { harness, el } = await abrirCaja([], [citaDe('CIT-00001', 'COMPLETADA')]);

    escribir(el, '.sin-cobro select', 'YAPE', 'change');
    (el.querySelector('.cobrar') as HTMLButtonElement).click();
    const post = http.expectOne(`${API}/api/pagos`);
    expect(post.request.body).toEqual({ codigoCita: 'CIT-00001', metodo: 'YAPE' });
    post.flush({ ...pagoDe(8, 'CIT-00001', 'COMPLETADO'), metodo: 'YAPE' }, { status: 201, statusText: 'Created' });
    http.expectNone((r) => r.url === `${API}/api/pagos/8/estado`); // no se hace un segundo paso
    http.expectOne(`${API}/api/pagos/resumen`).flush({ cobrado: 120, porCobrar: 0 });
    harness.detectChanges();

    expect(el.textContent).toContain('registrado y confirmado');
  });

  it('el medico no puede abrir /pagos', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/pagos');
    expect(TestBed.inject(Router).url).toBe('/inicio');
  });

  // ---------- administracion ----------
  it('solo el ADMIN entra a /admin/*: el medico es redirigido', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    for (const ruta of ['/admin/usuarios', '/admin/especialidades', '/admin/doctores']) {
      await harness.navigateByUrl(ruta);
      expect(TestBed.inject(Router).url).toBe('/inicio');
    }
  });

  it('usuarios: lista, no deja desactivar la propia cuenta y desactiva otra con PUT ?activo=false', async () => {
    iniciarSesion('ADMIN'); // correo de la sesion: a@a.pe
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/usuarios');
    http.expectOne(`${API}/api/usuarios`).flush([
      { idUsuario: 1, correo: 'a@a.pe', rol: 'ADMIN', activo: true },
      { idUsuario: 2, correo: 'medico@clinica.pe', rol: 'MEDICO', activo: true },
    ]);
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    const botones = el.querySelectorAll('.toggle') as NodeListOf<HTMLButtonElement>;
    expect(botones[0].disabled).toBe(true); // mi propia cuenta
    expect(botones[1].disabled).toBe(false);

    botones[1].click();
    const put = http.expectOne((r) => r.url === `${API}/api/usuarios/2/estado`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.params.get('activo')).toBe('false');
    put.flush({ correo: 'medico@clinica.pe', activo: false });
    harness.detectChanges();

    expect(el.textContent).toContain('medico@clinica.pe fue desactivada');
    expect((el.querySelectorAll('.toggle')[1] as HTMLElement).textContent).toContain('Activar');
  });

  async function abrirEspecialidades() {
    iniciarSesion('ADMIN');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/especialidades');
    http.expectOne(`${API}/api/especialidades`).flush(ESPECIALIDADES);
    harness.detectChanges();
    return { harness, el: harness.routeNativeElement as HTMLElement };
  }

  it('especialidades: valida el precio y no envia si es invalido', async () => {
    const { harness, el } = await abrirEspecialidades();

    escribir(el, '#nombre', 'Dermatologia');
    escribir(el, '#precio', '0');
    (el.querySelector('.guardar') as HTMLButtonElement).click();
    harness.detectChanges();

    http.expectNone(`${API}/api/especialidades`);
    expect(el.textContent).toContain('precio entre S/ 1 y S/ 5000');
    expect(el.textContent).toContain('Corrija los campos');
  });

  it('especialidades: crea una nueva con POST (nombre, descripcion y precio)', async () => {
    const { harness, el } = await abrirEspecialidades();

    escribir(el, '#nombre', 'Dermatologia');
    escribir(el, '#precio', '100');
    harness.detectChanges();
    (el.querySelector('.guardar') as HTMLButtonElement).click();

    const post = http.expectOne(`${API}/api/especialidades`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ nombre: 'Dermatologia', descripcion: null, precio: 100 });
    post.flush(
      { idEspecialidad: 3, nombre: 'Dermatologia', descripcion: null, precio: 100, activo: true },
      { status: 201, statusText: 'Created' },
    );
    harness.detectChanges();

    expect(el.textContent).toContain('Especialidad Dermatologia creada');
    expect(el.querySelectorAll('tbody tr').length).toBe(3);
  });

  it('especialidades: Editar carga el formulario y guarda con PUT', async () => {
    const { harness, el } = await abrirEspecialidades();

    (el.querySelector('.editar') as HTMLButtonElement).click();
    harness.detectChanges();
    expect((el.querySelector('#nombre') as HTMLInputElement).value).toBe('Cardiologia');
    expect((el.querySelector('#precio') as HTMLInputElement).value).toBe('120');

    escribir(el, '#precio', '150');
    (el.querySelector('.guardar') as HTMLButtonElement).click();

    const put = http.expectOne(`${API}/api/especialidades/1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ nombre: 'Cardiologia', descripcion: null, precio: 150 });
    put.flush({ ...ESPECIALIDADES[0], precio: 150 });
    harness.detectChanges();

    expect(el.textContent).toContain('Especialidad Cardiologia actualizada');
    expect(el.textContent).toContain('S/ 150.00');
  });

  it('especialidades: muestra el mensaje del backend si el nombre ya existe (400)', async () => {
    const { harness, el } = await abrirEspecialidades();

    escribir(el, '#nombre', 'Pediatria');
    escribir(el, '#precio', '80');
    (el.querySelector('.guardar') as HTMLButtonElement).click();
    http
      .expectOne(`${API}/api/especialidades`)
      .flush({ mensaje: 'Ya existe la especialidad Pediatria' }, { status: 400, statusText: 'Bad Request' });
    harness.detectChanges();

    expect(el.textContent).toContain('Ya existe la especialidad Pediatria');
  });

  it('especialidades: desactiva con PUT /estado?activo=false', async () => {
    const { harness, el } = await abrirEspecialidades();

    (el.querySelector('.toggle') as HTMLButtonElement).click();
    const put = http.expectOne((r) => r.url === `${API}/api/especialidades/1/estado`);
    expect(put.request.params.get('activo')).toBe('false');
    put.flush({ ...ESPECIALIDADES[0], activo: false });
    harness.detectChanges();

    expect(el.textContent).toContain('Cardiologia desactivada');
  });

  async function abrirDoctores() {
    iniciarSesion('ADMIN');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/doctores');
    http.expectOne(`${API}/api/doctores`).flush([{ ...DOCTORES[0], correo: 'cramirez@clinica.pe' }]);
    http.expectOne(`${API}/api/especialidades/activas`).flush(ESPECIALIDADES);
    harness.detectChanges();
    return { harness, el: harness.routeNativeElement as HTMLElement };
  }

  it('doctores: valida colegiatura, correo y contrasena antes de enviar', async () => {
    const { harness, el } = await abrirDoctores();

    escribir(el, '#colegiatura', '12');
    escribir(el, '#correo', 'mal');
    escribir(el, '#password', '123');
    (el.querySelector('.guardar') as HTMLButtonElement).click();
    harness.detectChanges();

    http.expectNone(`${API}/api/doctores`);
    expect(el.textContent).toContain('de 4 a 6 numeros');
    expect(el.textContent).toContain('Ingrese un correo valido');
    expect(el.textContent).toContain('al menos 6 caracteres');
    expect(el.textContent).toContain('Seleccione una especialidad');
  });

  it('doctores: registra uno nuevo con POST (incluye su cuenta de medico)', async () => {
    const { harness, el } = await abrirDoctores();

    escribir(el, '#colegiatura', '061234');
    escribir(el, '#especialidad', '2', 'change');
    escribir(el, '#nombres', 'Rosa');
    escribir(el, '#apellidos', 'Salazar');
    escribir(el, '#correo', 'rsalazar@clinica.pe');
    escribir(el, '#password', 'clave123');
    harness.detectChanges();
    (el.querySelector('.guardar') as HTMLButtonElement).click();

    const post = http.expectOne(`${API}/api/doctores`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      colegiatura: '061234',
      nombres: 'Rosa',
      apellidos: 'Salazar',
      idEspecialidad: 2,
      telefono: null,
      correo: 'rsalazar@clinica.pe',
      password: 'clave123',
    });
    post.flush(
      { colegiatura: '061234', nombres: 'Rosa', apellidos: 'Salazar', telefono: null, especialidad: ESPECIALIDADES[1] },
      { status: 201, statusText: 'Created' },
    );
    harness.detectChanges();

    expect(el.textContent).toContain('Rosa Salazar registrado');
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('doctores: Editar bloquea colegiatura, correo y clave, y guarda con PUT', async () => {
    const { harness, el } = await abrirDoctores();

    (el.querySelector('.editar') as HTMLButtonElement).click();
    harness.detectChanges();

    expect((el.querySelector('#colegiatura') as HTMLInputElement).disabled).toBe(true);
    expect((el.querySelector('#correo') as HTMLInputElement).disabled).toBe(true);
    expect((el.querySelector('#password') as HTMLInputElement).disabled).toBe(true);
    expect((el.querySelector('#colegiatura') as HTMLInputElement).value).toBe('045821');

    escribir(el, '#telefono', '987654321');
    (el.querySelector('.guardar') as HTMLButtonElement).click();

    const put = http.expectOne(`${API}/api/doctores/045821`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      nombres: 'Carlos',
      apellidos: 'Ramirez',
      idEspecialidad: 1,
      telefono: '987654321',
    });
    put.flush({ ...DOCTORES[0], telefono: '987654321', correo: 'cramirez@clinica.pe' });
    harness.detectChanges();

    expect(el.textContent).toContain('Carlos Ramirez actualizado');
    expect((el.querySelector('#colegiatura') as HTMLInputElement).disabled).toBe(false); // vuelve a "nuevo"
  });

  // ---------- horarios ----------
  const HORARIO_LUNES = {
    idHorario: 1,
    colegiaturaDoctor: '045821',
    nombreDoctor: 'Carlos Alberto Ramirez',
    diaSemana: 'LUNES',
    horaInicio: '08:00:00',
    horaFin: '13:00:00',
    activo: true,
  };

  it('el MEDICO ve sus horarios y agrega uno con POST /mis-horarios (sin enviar doctor)', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/horarios');
    http.expectOne(`${API}/api/horarios/mis-horarios`).flush([HORARIO_LUNES]);
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    expect(el.textContent).toContain('Mis horarios');
    expect(el.querySelector('#doctor')).toBeNull(); // el medico no elige doctor
    expect(el.textContent).toContain('08:00');

    escribir(el, '#dia', 'MARTES', 'change');
    escribir(el, '#inicio', '14:00');
    escribir(el, '#fin', '18:00');
    harness.detectChanges();
    (el.querySelector('.guardar') as HTMLButtonElement).click();

    const post = http.expectOne(`${API}/api/horarios/mis-horarios`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ diaSemana: 'MARTES', horaInicio: '14:00', horaFin: '18:00' });
    post.flush({ ...HORARIO_LUNES, idHorario: 2, diaSemana: 'MARTES', horaInicio: '14:00:00', horaFin: '18:00:00' });
    harness.detectChanges();

    expect(el.textContent).toContain('Horario del MARTES agregado');
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('horarios: no envia si la hora de fin no es posterior a la de inicio', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/horarios');
    http.expectOne(`${API}/api/horarios/mis-horarios`).flush([]);
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    expect(el.textContent).toContain('Sin horarios no se pueden reservar citas');

    escribir(el, '#dia', 'LUNES', 'change');
    escribir(el, '#inicio', '15:00');
    escribir(el, '#fin', '09:00');
    harness.detectChanges();
    (el.querySelector('.guardar') as HTMLButtonElement).click();
    harness.detectChanges();

    http.expectNone(`${API}/api/horarios/mis-horarios`);
    expect(el.textContent).toContain('La hora de fin debe ser posterior a la de inicio');
  });

  it('horarios: muestra el mensaje del backend si el horario se cruza (400)', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/horarios');
    http.expectOne(`${API}/api/horarios/mis-horarios`).flush([HORARIO_LUNES]);
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    escribir(el, '#dia', 'LUNES', 'change');
    escribir(el, '#inicio', '09:00');
    escribir(el, '#fin', '10:00');
    (el.querySelector('.guardar') as HTMLButtonElement).click();
    http
      .expectOne(`${API}/api/horarios/mis-horarios`)
      .flush({ mensaje: 'Ese horario se cruza con otro del LUNES' }, { status: 400, statusText: 'Bad Request' });
    harness.detectChanges();

    expect(el.textContent).toContain('Ese horario se cruza con otro del LUNES');
  });

  it('horarios: desactiva uno con PUT /estado?activo=false', async () => {
    iniciarSesion('MEDICO');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/horarios');
    http.expectOne(`${API}/api/horarios/mis-horarios`).flush([HORARIO_LUNES]);
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    (el.querySelector('.toggle') as HTMLButtonElement).click();
    const put = http.expectOne((r) => r.url === `${API}/api/horarios/1/estado`);
    expect(put.request.params.get('activo')).toBe('false');
    put.flush({ ...HORARIO_LUNES, activo: false });
    harness.detectChanges();

    expect(el.textContent).toContain('Horario del LUNES desactivado');
  });

  it('el ADMIN elige el doctor y agrega un horario con POST /api/horarios (con colegiatura)', async () => {
    iniciarSesion('ADMIN');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/horarios');
    http.expectOne(`${API}/api/horarios`).flush([HORARIO_LUNES]);
    http.expectOne(`${API}/api/doctores`).flush(DOCTORES);
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    expect(el.textContent).toContain('Horarios de los doctores');
    escribir(el, '#doctor', '052347', 'change');
    escribir(el, '#dia', 'JUEVES', 'change');
    escribir(el, '#inicio', '08:00');
    escribir(el, '#fin', '12:00');
    harness.detectChanges();
    (el.querySelector('.guardar') as HTMLButtonElement).click();

    const post = http.expectOne(`${API}/api/horarios`);
    expect(post.request.body).toEqual({
      colegiatura: '052347',
      diaSemana: 'JUEVES',
      horaInicio: '08:00',
      horaFin: '12:00',
    });
    post.flush({ ...HORARIO_LUNES, idHorario: 9, colegiaturaDoctor: '052347', diaSemana: 'JUEVES' });
  });

  // Ficha de un paciente de ejemplo (los pacientes no tienen cuenta)
  const PERFIL = {
    dni: '71234567',
    nombres: 'Ana Maria',
    apellidos: 'Gonzales Huaman',
    fechaNacimiento: '1998-05-14',
    telefono: '999888777',
    correo: 'ana@correo.com',
  };

  // ---------- pacientes (admin) e inicio por rol ----------
  it('el ADMIN lista pacientes y los filtra por DNI o nombre', async () => {
    iniciarSesion('ADMIN');
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/pacientes');
    http.expectOne(`${API}/api/pacientes`).flush([PERFIL, { ...PERFIL, dni: '72345678', nombres: 'Pedro', apellidos: 'Castillo' }]);
    harness.detectChanges();

    const el = harness.routeNativeElement as HTMLElement;
    expect(el.querySelectorAll('tbody tr').length).toBe(2);

    escribir(el, '.buscar', 'pedro');
    harness.detectChanges();
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
    expect(el.textContent).toContain('72345678');

    escribir(el, '.buscar', 'zzz');
    harness.detectChanges();
    expect(el.textContent).toContain('No se encontraron pacientes');
  });

  it('el inicio muestra accesos distintos segun el rol', async () => {
    const accesos = async (rol: 'ADMIN' | 'MEDICO') => {
      sessionStorage.clear();
      iniciarSesion(rol);
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [App],
        providers: [provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
      }).compileComponents();
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl('/inicio');
      return Array.from(harness.routeNativeElement?.querySelectorAll('.acceso strong') ?? []).map((e) => e.textContent);
    };

    expect(await accesos('MEDICO')).toEqual(['Mis citas', 'Reservar cita', 'Mis horarios']);
    expect((await accesos('ADMIN')).length).toBe(8);
  });

  // ---------- detalle ----------
  it('/citas/:codigo lee el parametro y pide esa cita a la API', async () => {
    iniciarSesion();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas/CIT-00002');

    http.expectOne(`${API}/api/citas/CIT-00002`).flush(citaDe('CIT-00002'));
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('CIT-00002');
    expect(harness.routeNativeElement?.textContent).toContain('Carlos');
  });

  it('si la cita no existe (404) muestra el mensaje del backend', async () => {
    iniciarSesion();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas/CIT-99999');

    http
      .expectOne(`${API}/api/citas/CIT-99999`)
      .flush({ mensaje: 'No existe la cita CIT-99999' }, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).toContain('No existe la cita CIT-99999');
  });

  // ---------- formulario de login ----------
  it('el login muestra errores de validacion si se envia vacio', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');
    const el = harness.routeNativeElement as HTMLElement;
    (el.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    harness.detectChanges();
    expect(el.textContent).toContain('El correo es obligatorio');
    expect(el.textContent).toContain('La contraseña es obligatoria');
    expect(el.textContent).toContain('Revise los campos');
  });

  // ---------- reservar cita ----------
  async function abrirReserva(rol: 'ADMIN' | 'MEDICO' = 'ADMIN') {
    iniciarSesion(rol);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas/nueva');
    http.expectOne(`${API}/api/especialidades/activas`).flush(ESPECIALIDADES);
    http.expectOne(`${API}/api/doctores`).flush(DOCTORES);
    if (rol === 'MEDICO') {
      // El medico es el doctor Carlos (045821)
      http.expectOne(`${API}/api/doctores/mi-perfil`).flush(DOCTORES[0]);
    }
    harness.detectChanges();
    return { harness, el: harness.routeNativeElement as HTMLElement };
  }

  it('sin sesion, /citas/nueva redirige al login', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/citas/nueva');
    expect(TestBed.inject(Router).url).toBe('/login');
  });

  it('el ADMIN reserva para un paciente: pide el DNI y lo envia en el POST', async () => {
    const { harness, el } = await abrirReserva('ADMIN');
    const fecha = enDias(3);

    expect(el.querySelector('#dniPaciente')).not.toBeNull();
    escribir(el, '#dniPaciente', '71234567');
    escribir(el, '#especialidad', '2', 'change');
    harness.detectChanges();
    escribir(el, '#doctor', '052347', 'change');
    escribir(el, '#fecha', fecha);
    http
      .expectOne((r) => r.url === `${API}/api/citas/disponibilidad`)
      .flush([{ hora: '09:00:00', horaFin: '09:30:00', disponible: true }]);
    harness.detectChanges();

    (el.querySelector('.hora') as HTMLButtonElement).click();
    escribir(el, '#motivo', 'Control');
    (el.querySelector('.enviar') as HTMLButtonElement).click();

    const post = http.expectOne(`${API}/api/citas`);
    expect(post.request.body).toEqual({
      dniPaciente: '71234567',
      colegiaturaDoctor: '052347',
      fecha,
      hora: '09:00:00',
      motivo: 'Control',
    });
    post.flush(citaDe('CIT-00008'), { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();
    http.expectOne(`${API}/api/citas`).flush([]); // la lista del admin se carga al volver
  });

  it('el ADMIN no envia si el DNI del paciente es invalido', async () => {
    const { harness, el } = await abrirReserva('ADMIN');

    escribir(el, '#dniPaciente', '123');
    (el.querySelector('.enviar') as HTMLButtonElement).click();
    harness.detectChanges();

    http.expectNone(`${API}/api/citas`);
    expect(el.textContent).toContain('El DNI debe tener 8 digitos');
  });

  it('el MEDICO tiene su especialidad y doctor fijos y solo agenda en su agenda', async () => {
    const { harness, el } = await abrirReserva('MEDICO');
    const fecha = enDias(3);

    expect((el.querySelector('#especialidad') as HTMLSelectElement).disabled).toBe(true);
    expect((el.querySelector('#doctor') as HTMLSelectElement).disabled).toBe(true);
    expect(el.textContent).toContain('solo puede reservar citas en su propia agenda');

    escribir(el, '#dniPaciente', '71234567');
    escribir(el, '#fecha', fecha);
    const consulta = http.expectOne((r) => r.url === `${API}/api/citas/disponibilidad`);
    expect(consulta.request.params.get('colegiatura')).toBe('045821');
    consulta.flush([{ hora: '10:00:00', horaFin: '10:30:00', disponible: true }]);
    harness.detectChanges();

    (el.querySelector('.hora') as HTMLButtonElement).click();
    escribir(el, '#motivo', 'Control de seguimiento');
    (el.querySelector('.enviar') as HTMLButtonElement).click();

    const post = http.expectOne(`${API}/api/citas`);
    expect(post.request.body).toEqual({
      dniPaciente: '71234567',
      colegiaturaDoctor: '045821',
      fecha,
      hora: '10:00:00',
      motivo: 'Control de seguimiento',
    });
    post.flush(citaDe('CIT-00009'), { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();
    http.expectOne(`${API}/api/citas/mis-citas`).flush([]);
  });

  it('al elegir especialidad se filtran los doctores y se muestra el precio', async () => {
    const { harness, el } = await abrirReserva();

    escribir(el, '#especialidad', '1', 'change');
    harness.detectChanges();

    expect(el.textContent).toContain('S/ 120');
    expect(el.querySelectorAll('#doctor option').length).toBe(2); // "Seleccione" + 1 doctor
    expect(el.querySelector('#doctor')?.textContent).toContain('Carlos');
    expect(el.querySelector('#doctor')?.textContent).not.toContain('Lucia');
  });

  it('reserva completa: disponibilidad, elegir hora y POST /api/citas', async () => {
    const { harness, el } = await abrirReserva();
    const fecha = enDias(3);

    escribir(el, '#dniPaciente', '71234567');
    escribir(el, '#especialidad', '1', 'change');
    harness.detectChanges();
    escribir(el, '#doctor', '045821', 'change');
    escribir(el, '#fecha', fecha);

    const consulta = http.expectOne((r) => r.url === `${API}/api/citas/disponibilidad`);
    expect(consulta.request.params.get('colegiatura')).toBe('045821');
    expect(consulta.request.params.get('fecha')).toBe(fecha);
    consulta.flush([
      { hora: '09:00:00', horaFin: '09:30:00', disponible: true },
      { hora: '09:30:00', horaFin: '10:00:00', disponible: false },
    ]);
    harness.detectChanges();

    const botones = el.querySelectorAll('.hora');
    expect(botones.length).toBe(2);
    expect((botones[1] as HTMLButtonElement).disabled).toBe(true); // ocupado
    (botones[0] as HTMLButtonElement).click();
    escribir(el, '#motivo', 'Dolor de cabeza');
    harness.detectChanges();

    (el.querySelector('.enviar') as HTMLButtonElement).click();
    const post = http.expectOne(`${API}/api/citas`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      dniPaciente: '71234567',
      colegiaturaDoctor: '045821',
      fecha,
      hora: '09:00:00',
      motivo: 'Dolor de cabeza',
    });
    post.flush(citaDe('CIT-00007'), { status: 201, statusText: 'Created' });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/citas?reservada=CIT-00007');
    http.expectOne(`${API}/api/citas`).flush([]); // la lista del admin se carga al volver
  });

  it('no envia la reserva si faltan datos y muestra el aviso general', async () => {
    const { harness, el } = await abrirReserva();

    (el.querySelector('.enviar') as HTMLButtonElement).click();
    harness.detectChanges();

    http.expectNone(`${API}/api/citas`);
    expect(el.textContent).toContain('Complete los datos de la cita');
    expect(el.textContent).toContain('Seleccione una especialidad');
    expect(el.textContent).toContain('Indique el motivo');
  });

  it('si el horario se ocupo (400) muestra el mensaje del backend y recarga horarios', async () => {
    const { harness, el } = await abrirReserva();
    const fecha = enDias(3);

    escribir(el, '#dniPaciente', '71234567');
    escribir(el, '#especialidad', '1', 'change');
    harness.detectChanges();
    escribir(el, '#doctor', '045821', 'change');
    escribir(el, '#fecha', fecha);
    http
      .expectOne((r) => r.url === `${API}/api/citas/disponibilidad`)
      .flush([{ hora: '09:00:00', horaFin: '09:30:00', disponible: true }]);
    harness.detectChanges();

    (el.querySelector('.hora') as HTMLButtonElement).click();
    escribir(el, '#motivo', 'Control');
    (el.querySelector('.enviar') as HTMLButtonElement).click();

    http
      .expectOne(`${API}/api/citas`)
      .flush({ mensaje: 'El doctor ya tiene una cita en ese horario' }, { status: 400, statusText: 'Bad Request' });
    http.expectOne((r) => r.url === `${API}/api/citas/disponibilidad`).flush([]);
    harness.detectChanges();

    expect(el.textContent).toContain('El doctor ya tiene una cita en ese horario');
  });

  // ---------- interceptor ----------
  it('el interceptor agrega Authorization: Bearer a las peticiones con sesion', () => {
    iniciarSesion();
    TestBed.inject(HttpClient).get(`${API}/api/citas/mis-citas`).subscribe();
    const peticion = http.expectOne(`${API}/api/citas/mis-citas`);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    peticion.flush([]);
  });

  it('el interceptor NO agrega token al login', () => {
    iniciarSesion();
    TestBed.inject(HttpClient).post(`${API}/auth/login`, {}).subscribe();
    const peticion = http.expectOne(`${API}/auth/login`);
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush({});
  });

  it('ante un 401 el interceptor cierra la sesion', () => {
    iniciarSesion();
    const auth = TestBed.inject(AuthService);
    TestBed.inject(HttpClient).get(`${API}/api/citas/mis-citas`).subscribe({ error: () => {} });
    http
      .expectOne(`${API}/api/citas/mis-citas`)
      .flush({ mensaje: 'vencida' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.estaAutenticado()).toBe(false);
  });
});
