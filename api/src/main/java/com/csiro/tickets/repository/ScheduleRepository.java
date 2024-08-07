package com.csiro.tickets.repository;

import com.csiro.tickets.models.Schedule;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

  Optional<Schedule> findByName(String name);
}
