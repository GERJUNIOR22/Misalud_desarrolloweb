package com.utp.Citasmedicas.service;

import com.utp.Citasmedicas.exception.*;
import com.utp.Citasmedicas.dto.SlotDisponible;
import com.utp.Citasmedicas.dto.CambioEstadoRequest;
import com.utp.Citasmedicas.dto.CitaRequest;
import com.utp.Citasmedicas.entity.*;
import com.utp.Citasmedicas.repository.CitaRepository;
import com.utp.Citasmedicas.repository.DoctorRepository;
import com.utp.Citasmedicas.repository.HorarioMedicoRepository;
import com.utp.Citasmedicas.repository.PacienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CitaService {

    // Estas citas ocupan la agenda del doctor
    private static final List<EstadoCita> OCUPAN = List.of(
            EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA, EstadoCita.COMPLETADA);

    private final CitaRepository citaRepository;
    private final DoctorRepository doctorRepository;
    private final PacienteRepository pacienteRepository;
    private final HorarioMedicoRepository horarioRepository;

    public CitaService(CitaRepository citaRepository,
                       DoctorRepository doctorRepository,
                       PacienteRepository pacienteRepository,
                       HorarioMedicoRepository horarioRepository) {
        this.citaRepository = citaRepository;
        this.doctorRepository = doctorRepository;
        this.pacienteRepository = pacienteRepository;
        this.horarioRepository = horarioRepository;
    }

    // ADMIN: todas, con filtros opcionales (cualquiera puede ser null)
    public List<Cita> listar(String colegiatura, String dni, LocalDate fecha, EstadoCita estado) {
        return citaRepository.findAll().stream()
                .filter(c -> colegiatura == null || c.getDoctor().getColegiatura().equals(colegiatura))
                .filter(c -> dni == null || c.getPaciente().getDni().equals(dni))
                .filter(c -> fecha == null || c.getFecha().equals(fecha))
                .filter(c -> estado == null || c.getEstado() == estado)
                .sorted(Comparator.comparing(Cita::getFecha).thenComparing(Cita::getHora).reversed())
                .toList();
    }

    // Una cita: el ADMIN cualquiera, el MEDICO solo las de su agenda
    public Cita buscar(String codigo, String correo, String rol) {
        Cita cita = citaRepository.findById(codigo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la cita " + codigo));
        if (rol.equals("MEDICO") && !correo.equals(cita.getDoctor().getCorreo())) {
            throw new SecurityException("Esa cita no es de tu agenda");
        }
        return cita;
    }

    // Espacios del doctor en una fecha: libres u ocupados (para el calendario del frontend)
    public List<SlotDisponible> disponibilidad(String colegiatura, LocalDate fecha, Integer duracionMinutos) {
        if (!doctorRepository.existsById(colegiatura)) {
            throw new RecursoNoEncontradoException("No existe un doctor con colegiatura " + colegiatura);
        }
        int duracion = duracionMinutos != null ? duracionMinutos : 30;
        if (duracion < 15 || duracion > 120) {
            throw new ReglaNegocioException("La duracion debe estar entre 15 y 120 minutos");
        }

        DiaSemana dia = DiaSemana.de(fecha.getDayOfWeek());
        List<HorarioMedico> horarios = horarioRepository
                .findByDoctorColegiaturaAndDiaSemanaAndActivoTrue(colegiatura, dia);
        List<Cita> ocupadas = citaRepository.citasDelDia(colegiatura, fecha, OCUPAN);

        List<SlotDisponible> slots = new ArrayList<>();
        for (HorarioMedico h : horarios.stream().sorted(Comparator.comparing(HorarioMedico::getHoraInicio)).toList()) {
            LocalTime inicio = h.getHoraInicio();
            while (!inicio.plusMinutes(duracion).isAfter(h.getHoraFin())
                    && inicio.plusMinutes(duracion).isAfter(inicio)) {
                LocalTime fin = inicio.plusMinutes(duracion);
                LocalTime ini = inicio;
                boolean pasada = fecha.isBefore(LocalDate.now())
                        || (fecha.equals(LocalDate.now()) && !ini.isAfter(LocalTime.now()));
                boolean cruza = ocupadas.stream().anyMatch(c ->
                        c.getHora().isBefore(fin) && c.getHoraFin().isAfter(ini));
                slots.add(new SlotDisponible(inicio, fin, !pasada && !cruza));
                inicio = fin;
            }
        }
        return slots;
    }

    // MEDICO: las de su agenda
    public List<Cita> misCitas(String correo, String rol) {
        return citaRepository.findByDoctorColegiaturaOrderByFechaDescHoraDesc(doctorDelCorreo(correo).getColegiatura());
    }

    // Reserva hecha por el PERSONAL (ADMIN o MEDICO).
    // Si el paciente no tiene ficha, se crea con los datos enviados (autocompletados desde RENIEC).
    // @Transactional = todo o nada (si la cita falla, tampoco queda la ficha)
    @Transactional
    public Cita registrar(CitaRequest request, String correo, String rol) {

        // Regla 1: el personal indica el DNI del paciente
        String dni = request.getDniPaciente() == null ? "" : request.getDniPaciente().trim();
        if (!dni.matches("\\d{8}")) {
            throw new ReglaNegocioException("El DNI del paciente debe tener 8 digitos");
        }

        Paciente paciente = pacienteRepository.findById(dni).orElse(null);
        if (paciente == null) {
            // Regla 2: para un paciente nuevo se necesitan sus nombres y apellidos
            String nombres = limpiar(request.getNombresPaciente());
            String apellidos = limpiar(request.getApellidosPaciente());
            if (nombres == null || apellidos == null) {
                throw new ReglaNegocioException("El DNI " + dni + " no tiene ficha: ingrese nombres y apellidos del paciente");
            }
            paciente = pacienteRepository.save(new Paciente(dni, nombres, apellidos,
                    request.getFechaNacimientoPaciente(), null, null));
        } else if (paciente.getFechaNacimiento() == null && request.getFechaNacimientoPaciente() != null) {
            // Si la ficha no tenia fecha de nacimiento, se completa (no se sobrescribe lo que ya habia)
            paciente.setFechaNacimiento(request.getFechaNacimientoPaciente());
        }
        return crearCita(paciente, request, correo, rol);
    }

    private static String limpiar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }

    // Reserva publica (sin login): el paciente ya fue buscado o creado por ReservaPublicaService
    @Transactional
    public Cita registrarParaPaciente(Paciente paciente, CitaRequest request) {
        return crearCita(paciente, request, null, "PUBLICO");
    }

    // Reglas comunes de TODA reserva: doctor, fecha, horario del doctor y cruces con otras citas
    private Cita crearCita(Paciente paciente, CitaRequest request, String correo, String rol) {

        // buscarParaReservar bloquea al doctor hasta terminar (la agenda se revisa sin carreras)
        Doctor doctor = doctorRepository.buscarParaReservar(request.getColegiaturaDoctor())
                .orElseThrow(() -> new ReglaNegocioException(
                        "No existe un doctor con colegiatura " + request.getColegiaturaDoctor()));

        // Regla 1b: el MEDICO solo agenda en SU propia agenda (por ejemplo, un control de seguimiento)
        if (rol.equals("MEDICO") && !correo.equals(doctor.getCorreo())) {
            throw new SecurityException("El medico solo puede reservar citas en su propia agenda");
        }

        LocalDate fecha = request.getFecha();
        LocalTime inicio = request.getHora();
        int duracion = request.getDuracionMinutos() != null ? request.getDuracionMinutos() : 30;
        LocalTime fin = inicio.plusMinutes(duracion);

        // Regla 2: fecha valida (ni pasada, ni una hora que ya paso hoy)
        if (fecha.isBefore(LocalDate.now())) {
            throw new ReglaNegocioException("No se puede sacar cita en una fecha pasada");
        }
        if (fecha.equals(LocalDate.now()) && !inicio.isAfter(LocalTime.now())) {
            throw new ReglaNegocioException("Esa hora ya paso");
        }
        if (!fin.isAfter(inicio)) {
            throw new ReglaNegocioException("La cita no puede pasar de la medianoche");
        }

        // Regla 3: dentro del horario del doctor ese dia
        DiaSemana dia = DiaSemana.de(fecha.getDayOfWeek());
        List<HorarioMedico> horarios = horarioRepository
                .findByDoctorColegiaturaAndDiaSemanaAndActivoTrue(doctor.getColegiatura(), dia);
        boolean dentroDelHorario = horarios.stream().anyMatch(h ->
                !inicio.isBefore(h.getHoraInicio()) && !fin.isAfter(h.getHoraFin()));
        if (!dentroDelHorario) {
            throw new ReglaNegocioException("El doctor no atiende el " + dia + " de " + inicio + " a " + fin);
        }

        // Regla 4 (JPQL): no se cruza con otra cita del doctor
        // Se cruzan si: la otra empieza antes de que termine esta y termina despues de que empieza esta
        List<Cita> delDia = citaRepository.citasDelDia(doctor.getColegiatura(), fecha, OCUPAN);
        boolean cruce = delDia.stream().anyMatch(c ->
                c.getHora().isBefore(fin) && c.getHoraFin().isAfter(inicio));
        if (cruce) {
            throw new ReglaNegocioException("El doctor ya tiene una cita en ese horario");
        }

        Cita cita = new Cita(generarCodigo(), doctor, paciente, fecha, inicio, duracion, request.getMotivo());
        return citaRepository.save(cita);
    }

    // Cambiar estado segun quien lo pide y las reglas del negocio
    @Transactional
    public Cita cambiarEstado(String codigo, CambioEstadoRequest request, String correo, String rol) {
        Cita cita = citaRepository.findById(codigo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la cita " + codigo));
        EstadoCita nuevo = request.getEstado();

        // Quien puede: el medico solo toca las citas de SU agenda
        if (rol.equals("MEDICO")) {
            if (!correo.equals(cita.getDoctor().getCorreo())) {
                throw new SecurityException("Esa cita no es de tu agenda");
            }
            if (nuevo == EstadoCita.CANCELADA) {
                throw new SecurityException("El medico no cancela: CONFIRMA, RECHAZA o COMPLETA");
            }
        }

        // Que cambios se permiten (el ciclo de la cita)
        boolean permitido = switch (cita.getEstado()) {
            case PENDIENTE -> nuevo == EstadoCita.CONFIRMADA || nuevo == EstadoCita.RECHAZADA
                    || nuevo == EstadoCita.CANCELADA;
            case CONFIRMADA -> nuevo == EstadoCita.COMPLETADA || nuevo == EstadoCita.CANCELADA;
            case RECHAZADA, CANCELADA, COMPLETADA -> false;   // ya terminaron
        };
        if (!permitido) {
            throw new ReglaNegocioException("No se puede pasar de " + cita.getEstado() + " a " + nuevo);
        }

        cita.setEstado(nuevo);
        if (request.getObservacion() != null && !request.getObservacion().isBlank()) {
            cita.setObservacion(request.getObservacion());
        }
        return citaRepository.save(cita);
    }

    // CIT-00002 -> CIT-00003
    private String generarCodigo() {
        String ultimo = citaRepository.ultimoCodigo();
        int siguiente = (ultimo == null) ? 1 : Integer.parseInt(ultimo.substring(4)) + 1;
        return String.format("CIT-%05d", siguiente);
    }

    private Doctor doctorDelCorreo(String correo) {
        return doctorRepository.findByUsuarioCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tu cuenta no tiene un doctor asociado"));
    }
}
