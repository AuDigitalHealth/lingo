package com.csiro.tickets.controllers;

import com.csiro.tickets.models.Ticket;
import com.csiro.tickets.service.ExportService;
import jakarta.servlet.http.HttpServletRequest;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ExportController {

  @Autowired ExportService exportService;

  @GetMapping("/api/tickets/export/{iterationId}")
  public ResponseEntity adhaCsvExport(HttpServletRequest request, @PathVariable Long iterationId) {
    String filename = "SnomioTickets_ExternallyRequested_.csv";

    InputStreamResource csv = new InputStreamResource(exportService.adhaCsvExport(iterationId));
    return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename).contentType(MediaType.parseMediaType("text/csv"))
        .body(csv)
        ;
  }
}
