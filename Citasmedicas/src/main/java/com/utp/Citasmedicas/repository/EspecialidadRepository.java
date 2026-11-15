package com.utp.Citasmedicas.repository;

import com.utp.Citasmedicas.entity.Especialidad;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EspecialidadRepository extends JpaRepository<Especialidad, Long> {

    // Solo las activas (para que el paciente elija)
    List<Especialidad> findByActivoTrue();

    // Para no repetir nombres al registrar
    boolean existsByNombreIgnoreCase(String nombre);

    // Para no repetir nombres al actualizar (sin contarse a si misma)
    boolean existsByNombreIgnoreCaseAndIdEspecialidadNot(String nombre, Long idEspecialidad);
}
