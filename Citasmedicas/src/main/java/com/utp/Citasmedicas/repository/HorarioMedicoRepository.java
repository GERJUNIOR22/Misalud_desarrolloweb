package com.utp.Citasmedicas.repository;

import com.utp.Citasmedicas.entity.DiaSemana;
import com.utp.Citasmedicas.entity.HorarioMedico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalTime;
import java.util.List;

public interface HorarioMedicoRepository extends JpaRepository<HorarioMedico, Long> {

    // Horarios activos de un doctor (lo que ve el paciente)
    List<HorarioMedico> findByDoctorColegiaturaAndActivoTrue(String colegiatura);

    // Todos los horarios de un doctor (activos y no)
    List<HorarioMedico> findByDoctorColegiatura(String colegiatura);

    // Horarios activos de un doctor en un dia (para las citas del Paso 16)
    List<HorarioMedico> findByDoctorColegiaturaAndDiaSemanaAndActivoTrue(String colegiatura, DiaSemana diaSemana);

    // JPQL: cuenta horarios que se CRUZAN con el nuevo (mismo doctor, mismo dia, activos)
    // Se cruzan si: el que existe empieza antes de que termine el nuevo
    //               y termina despues de que empieza el nuevo
    @Query("SELECT COUNT(h) FROM HorarioMedico h " +
           "WHERE h.doctor.colegiatura = :colegiatura AND h.diaSemana = :dia AND h.activo = true " +
           "AND h.horaInicio < :fin AND h.horaFin > :inicio")
    long contarCruces(@Param("colegiatura") String colegiatura,
                      @Param("dia") DiaSemana dia,
                      @Param("inicio") LocalTime inicio,
                      @Param("fin") LocalTime fin);
}
