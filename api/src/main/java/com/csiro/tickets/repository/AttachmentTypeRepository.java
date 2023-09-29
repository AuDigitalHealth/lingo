package com.csiro.tickets.repository;

import com.csiro.tickets.models.AttachmentType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentTypeRepository extends JpaRepository<AttachmentType, Long> {

  List<AttachmentType> findAllByMimeType(String type);

  Optional<AttachmentType> findByMimeType(String type);
}
