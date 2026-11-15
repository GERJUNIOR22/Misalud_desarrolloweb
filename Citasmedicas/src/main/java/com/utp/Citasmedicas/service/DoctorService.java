package com.utp.Citasmedicas.service;

import com.utp.Citasmedicas.exception.*;
import com.utp.Citasmedicas.dto.DoctorActualizarRequest;
import com.utp.Citasmedicas.dto.DoctorRequest;
import com.utp.Citasmedicas.entity.Doctor;
import com.utp.Citasmedicas.entity.Especialidad;
import com.utp.Citasmedicas.entity.Usuario;
import com.utp.Citasmedicas.repository.DoctorRepository;
import com.utp.Citasmedicas.repository.EspecialidadRepository;
import com.utp.Citasmedicas.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final EspecialidadRepository especialidadRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DoctorService(DoctorRepository doctorRepository,
                         EspecialidadRepository especialidadRepository,
                         UsuarioRepository usuarioRepository,
                         PasswordEncoder passwordEncoder) {
        this.doctorRepository = doctorRepository;
        this.especialidadRepository = especialidadRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Doctor> listar() {
        return doctorRepository.findAll();
    }

    public Doctor buscarPorColegiatura(String colegiatura) {
        return doctorRepository.findById(colegiatura).orElse(null);
    }

    public List<Doctor> buscarPorEspecialidad(String especialidad) {
        return doctorRepository.findByEspecialidadNombreIgnoreCase(especialidad);
    }

    // El medico ve sus propios datos (lo busca por el correo de su token)
    public Doctor miPerfil(String correo) {
        return doctorRepository.findByUsuarioCorreo(correo)
                .orElseThrow(() -> new RecursoNoEncontradoException("Tu cuenta no tiene un doctor asociado"));
    }

    // El ADMIN crea al doctor y su cuenta MEDICO a la vez
    // @Transactional: si algo falla, no se guarda ni el usuario ni el doctor
    @Transactional
    public Doctor registrar(DoctorRequest request) {
        String correo = request.getCorreo().trim().toLowerCase();

        if (doctorRepository.existsById(request.getColegiatura())) {
            throw new ReglaNegocioException("Ya existe un doctor con la colegiatura " + request.getColegiatura());
        }
        if (usuarioRepository.existsByCorreo(correo)) {
            throw new ReglaNegocioException("El correo ya esta registrado");
        }
        Especialidad especialidad = buscarEspecialidadActiva(request.getIdEspecialidad());

        Usuario usuario = new Usuario(correo, passwordEncoder.encode(request.getPassword()), "MEDICO");
        usuarioRepository.save(usuario);

        Doctor doctor = new Doctor(request.getColegiatura(), request.getNombres(), request.getApellidos(),
                request.getTelefono(), especialidad, usuario);
        return doctorRepository.save(doctor);
    }

    // El ADMIN actualiza los datos (la colegiatura no cambia)
    @Transactional
    public Doctor actualizar(String colegiatura, DoctorActualizarRequest request) {
        Doctor doctor = doctorRepository.findById(colegiatura)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un doctor con la colegiatura " + colegiatura));

        doctor.setNombres(request.getNombres());
        doctor.setApellidos(request.getApellidos());
        doctor.setTelefono(request.getTelefono());
        doctor.setEspecialidad(buscarEspecialidadActiva(request.getIdEspecialidad()));
        return doctorRepository.save(doctor);
    }

    // No se puede asignar una especialidad que no existe o esta desactivada
    private Especialidad buscarEspecialidadActiva(Long idEspecialidad) {
        Especialidad especialidad = especialidadRepository.findById(idEspecialidad)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la especialidad " + idEspecialidad));
        if (!especialidad.isActivo()) {
            throw new ReglaNegocioException("La especialidad " + especialidad.getNombre() + " esta desactivada");
        }
        return especialidad;
    }
}
