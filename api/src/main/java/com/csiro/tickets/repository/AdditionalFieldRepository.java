package com.csiro.tickets.repository;

import com.csiro.tickets.models.AdditionalFieldType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdditionalFieldRepository extends JpaRepository<AdditionalFieldType, Long> {}
