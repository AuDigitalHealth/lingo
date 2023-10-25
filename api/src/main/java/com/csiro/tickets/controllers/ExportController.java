package com.csiro.tickets.controllers;

import com.csiro.tickets.service.ExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ExportController {

  @Autowired ExportService exportService;

  @GetMapping("/api/tickets/export/{iterationId}")
  public ResponseEntity<InputStreamResource> adhaCsvExport(@PathVariable Long iterationId) {

    return exportService.adhaCsvExport(iterationId);
  }
}
