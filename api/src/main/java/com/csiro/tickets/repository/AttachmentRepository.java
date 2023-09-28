package com.csiro.tickets.repository;

import com.csiro.tickets.models.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {}
