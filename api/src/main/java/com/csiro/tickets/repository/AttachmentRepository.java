package com.csiro.tickets.repository;

import com.csiro.tickets.models.Attachment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
  Optional<Attachment> findByThumbnailLocation(String location);

  List<Attachment> findAll();
}
