package com.utp.Citasmedicas.service;

import com.utp.Citasmedicas.exception.*;
import com.utp.Citasmedicas.dto.HorarioRequest;
import com.utp.Citasmedicas.entity.Doctor;
import com.utp.Citasmedicas.entity.HorarioMedico;
import com.utp.Citasmedicas.repository.DoctorRepository;
import com.utp.Citasmedicas.repository.HorarioMedicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HorarioMedicoService {

    private final HorarioMedicoRepository horarioRepository;
    private final DoctorRepository doctorRepository;

    public HorarioMedicoService(HorarioMedicoRepository horarioRepository,
                                DoctorRepository doctorRepository) {
        this.horarioRepository = horarioRepository;
        this.doctorRepository = doctorRepository;
    }

    // Lo que ve cualquiera: cuando atiende un doctor
    public List<HorarioMedico> listarActivosDeDoctor(String colegiatura) {
        return horarioRepository.findByDoctorColegiaturaAndActivoTrue(colegiatura);
    }

    // ADMIN: todos los horarios de todos los doctores
    public List<HorarioMedico> listarTodos() {
        return horarioRepository.findAll();
    }

    // El medico ve TODOS sus horarios (segun su token)
    public List<HorarioMedico> misHorarios(String correo) {
        return horarioRepository.findByDoctorColegiatura(doctorDelCorreo(correo).getColegiatura());
    }

    // El medico crea un horario para EL MISMO
    @Transactional
    public HorarioMedico registrarMio(String correo, HorarioRequest request) {
        return registrar(doctorDelCorreo(correo), request);
    }

    // El ADMIN crea un horario para cualquier doctor
    @Transactional
    public HorarioMedico registrarPorAdmin(HorarioRequest request) {
        if (request.getColegiatura() == null || request.getColegiatura().isBlank()) {
            throw new ReglaNegocioException("La colegiatura es obligatoria");
        }
        Doctor doctor = doctorRepository.findById(request.getColegiatura())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un doctor con la colegiatura " + request.getColegiatura()));
        return registrar(doctor, request);
    }

    // Activar / desactivar. El medico solo puede tocar SUS horarios
    @Transactional
    public HorarioMedico cambiarEstado(Long idHorario, boolean activo, String correo, boolean esAdmin) {
        HorarioMedico horario = horarioRepository.findById(idHorario)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el horario " + idHorario));

        if (!esAdmin && !correo.equals(horario.getDoctor().getCorreo())) {
            throw new SecurityException("Ese horario no es tuyo");
        }

        horario.setActivo(activo);
        return horarioRepository.save(horario);
    }

    private HorarioMedico registrar(Doctor doctor, HorarioRequest request) {
        // Regla 1: la hora de inicio va antes que la de fin
        if (!request.getHoraInicio().isBefore(request.getHoraFin())) {
            throw new ReglaNegocioException("La hora de inicio debe ser antes que la hora de fin");
        }

        // Regla 2 (JPQL): no se puede cruzar con otro horario del mismo dia
        long cruces = horarioRepository.contarCruces(doctor.getColegiatura(), request.getDiaSemana(),
                request.getHoraInicio(), request.getHoraFin());
        if (cruces > 0) {
            throw new ReglaNegocioException("Ese horario se cruza con otro del " + request.getDiaSemana());
        }

        HorarioMedico horario = new HorarioMedico(doctor, request.getDiaSemana(),
                request.getHoraInicio(), request.getHoraFin());
        return horarioRepository.save(horario);
    }

    private Doctor doctorDelCorreo(String correo) {
        return doctorRepository.findByUsuarioCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tu cuenta no tiene un doctor asociado"));
    }
}
