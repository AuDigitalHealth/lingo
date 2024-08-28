package com.csiro.tickets.controllers;

import com.csiro.snomio.exception.ResourceNotFoundProblem;
import com.csiro.tickets.JobResultDto;
import com.csiro.tickets.models.JobResult;
import com.csiro.tickets.models.mappers.JobResultMapper;
import com.csiro.tickets.repository.JobResultRepository;
import java.util.List;
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

    JobResult jobResult = jobResultMapper.toEntity(jobResultDto);

    jobResultRepository.save(jobResult);

    return new ResponseEntity<>(HttpStatus.CREATED);
  }

  @GetMapping
  public ResponseEntity<List<JobResultDto>> getJobResults() {

    List<JobResult> jobResults = jobResultRepository.findAll();

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
