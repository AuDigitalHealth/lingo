package com.csiro.tickets.repository;

import com.csiro.tickets.models.LabelType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabelRepository extends JpaRepository<LabelType, Long> {}
