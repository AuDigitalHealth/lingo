package com.csiro.tickets.repository;

import com.csiro.tickets.models.Iteration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IterationRepository extends JpaRepository<Iteration, Long> {

}
