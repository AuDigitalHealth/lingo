package com.csiro.tickets.repository;

import com.csiro.tickets.models.JobResult;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobResultRepository extends JpaRepository<JobResult, Long> {
  boolean existsByJobId(String jobId);

  List<JobResult> findByCreatedAfter(Instant date);
}
