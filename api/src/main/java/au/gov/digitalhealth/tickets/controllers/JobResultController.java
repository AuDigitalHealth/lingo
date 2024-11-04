/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.tickets.controllers;

import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.JobResultDto;
import au.gov.digitalhealth.tickets.models.JobResult;
import au.gov.digitalhealth.tickets.models.mappers.JobResultMapper;
import au.gov.digitalhealth.tickets.repository.JobResultRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets/jobResults")
public class JobResultController {

  private final JobResultMapper jobResultMapper;

  private final JobResultRepository jobResultRepository;

  public JobResultController(
      JobResultMapper jobResultMapper, JobResultRepository jobResultRepository) {
    this.jobResultMapper = jobResultMapper;
    this.jobResultRepository = jobResultRepository;
  }

  @PostMapping
  public ResponseEntity<Void> createJobResult(@RequestBody JobResultDto jobResultDto) {

    // If jobId is not provided, generate a unique one
    if (jobResultDto.getJobId() == null || jobResultDto.getJobId().isBlank()) {
      jobResultDto.setJobId(UUID.randomUUID().toString());
    }

    // Ensure the jobId is unique in the database
    if (jobResultRepository.existsByJobId(jobResultDto.getJobId())) {
      return new ResponseEntity<>(HttpStatus.CONFLICT);
    }

    JobResult jobResult = jobResultMapper.toEntity(jobResultDto);

    jobResultRepository.save(jobResult);

    return new ResponseEntity<>(HttpStatus.CREATED);
  }

  // There is a requirement that we only send JobResults from within the last week.
  @GetMapping
  public ResponseEntity<List<JobResultDto>> getJobResults() {

    Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);

    List<JobResult> jobResults = jobResultRepository.findByCreatedAfter(oneWeekAgo);

    List<JobResultDto> jobResultDtos = jobResults.stream().map(jobResultMapper::toDto).toList();

    return new ResponseEntity<>(jobResultDtos, HttpStatus.OK);
  }

  @PostMapping("/{jobResultId}")
  public ResponseEntity<JobResult> acklowedgeJobResult(@PathVariable Long jobResultId) {

    JobResult jr =
        jobResultRepository
            .findById(jobResultId)
            .orElseThrow(
                () ->
                    new ResourceNotFoundProblem(
                        String.format("Job Result With Id %s not found", jobResultId)));

    jr.setAcknowledged(true);

    return new ResponseEntity<>(jobResultRepository.save(jr), HttpStatus.OK);
  }
}
