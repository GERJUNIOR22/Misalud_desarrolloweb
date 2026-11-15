package com.utp.Citasmedicas.service;

import com.utp.Citasmedicas.exception.*;
import com.utp.Citasmedicas.dto.EspecialidadRequest;
import com.utp.Citasmedicas.entity.Especialidad;
import com.utp.Citasmedicas.repository.EspecialidadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EspecialidadService {

    private final EspecialidadRepository especialidadRepository;

    public EspecialidadService(EspecialidadRepository especialidadRepository) {
        this.especialidadRepository = especialidadRepository;
    }

    public List<Especialidad> listar() {
        return especialidadRepository.findAll();
    }

    public List<Especialidad> listarActivas() {
        return especialidadRepository.findByActivoTrue();
    }

    public Especialidad buscar(Long id) {
        return especialidadRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la especialidad " + id));
    }

    @Transactional
    public Especialidad registrar(EspecialidadRequest request) {
        String nombre = request.getNombre().trim();

        if (especialidadRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ReglaNegocioException("Ya existe la especialidad " + nombre);
        }

        return especialidadRepository.save(new Especialidad(nombre, request.getDescripcion(), request.getPrecio()));
    }

    @Transactional
    public Especialidad actualizar(Long id, EspecialidadRequest request) {
        Especialidad especialidad = buscar(id);
        String nombre = request.getNombre().trim();

        if (especialidadRepository.existsByNombreIgnoreCaseAndIdEspecialidadNot(nombre, id)) {
            throw new ReglaNegocioException("Ya existe otra especialidad llamada " + nombre);
        }

        especialidad.setNombre(nombre);
        especialidad.setDescripcion(request.getDescripcion());
        especialidad.setPrecio(request.getPrecio());
        return especialidadRepository.save(especialidad);
    }

    @Transactional
    public Especialidad cambiarEstado(Long id, boolean activo) {
        Especialidad especialidad = buscar(id);
        especialidad.setActivo(activo);
        return especialidadRepository.save(especialidad);
    }
}
