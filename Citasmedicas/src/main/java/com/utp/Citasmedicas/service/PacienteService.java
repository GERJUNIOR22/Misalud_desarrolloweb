package com.utp.Citasmedicas.service;

import com.utp.Citasmedicas.exception.*;
import com.utp.Citasmedicas.dto.DatosDni;
import com.utp.Citasmedicas.dto.PacienteActualizarRequest;
import com.utp.Citasmedicas.entity.Paciente;
import com.utp.Citasmedicas.repository.PacienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PacienteService {

    private final PacienteRepository pacienteRepository;
    private final ReniecService reniecService;

    public PacienteService(PacienteRepository pacienteRepository, ReniecService reniecService) {
        this.pacienteRepository = pacienteRepository;
        this.reniecService = reniecService;
    }

    // Autocompletar por DNI: primero la ficha guardada; si no hay, se consulta RENIEC
    public DatosDni consultarDni(String dni) {
        if (dni == null || !dni.matches("\\d{8}")) {
            throw new ReglaNegocioException("El DNI debe tener 8 digitos");
        }
        return pacienteRepository.findById(dni)
                .map(p -> new DatosDni(p.getDni(), p.getNombres(), p.getApellidos(),
                        p.getFechaNacimiento(), p.getTelefono(), "FICHA"))
                .orElseGet(() -> reniecService.consultar(dni));
    }

    public List<Paciente> listar() {
        return pacienteRepository.findAll();
    }

    public Paciente buscarPorDni(String dni) {
        return pacienteRepository.findById(dni)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un paciente con DNI " + dni));
    }

    // El ADMIN actualiza los datos de cualquier paciente
    @Transactional
    public Paciente actualizarPorDni(String dni, PacienteActualizarRequest request) {
        return actualizar(buscarPorDni(dni), request);
    }

    // El DNI no se toca (es la clave)
    private Paciente actualizar(Paciente paciente, PacienteActualizarRequest request) {
        paciente.setNombres(request.getNombres());
        paciente.setApellidos(request.getApellidos());
        paciente.setFechaNacimiento(request.getFechaNacimiento());
        paciente.setTelefono(request.getTelefono());
        return pacienteRepository.save(paciente);
    }
}
