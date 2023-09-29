package com.csiro.tickets.repository;

import com.csiro.tickets.models.AdditionalFieldType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdditionalFieldTypeRepository extends JpaRepository<AdditionalFieldType, Long> {

  Optional<AdditionalFieldType> findByName(String name);
}
