package com.csiro.tickets.controllers;

import com.csiro.tickets.models.PriorityBucket;
import com.csiro.tickets.repository.PriorityBucketRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PriorityBucketController {

  @Autowired private PriorityBucketRepository priorityBucketRepository;

  @GetMapping(value = "/api/tickets/priorityBuckets")
  public ResponseEntity<List<PriorityBucket>> getAllBuckets() {

    List<PriorityBucket> priorityBuckets = priorityBucketRepository.findAll();

    return new ResponseEntity<>(priorityBuckets, HttpStatus.OK);
  }
}
