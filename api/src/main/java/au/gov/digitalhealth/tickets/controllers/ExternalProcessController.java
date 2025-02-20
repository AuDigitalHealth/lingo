package au.gov.digitalhealth.tickets.controllers;

import au.gov.digitalhealth.tickets.models.ExternalProcess;
import au.gov.digitalhealth.tickets.service.ExternalProcessService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tickets/external-processes") // Added a base path for clarity
public class ExternalProcessController {

  private final ExternalProcessService externalProcessService;

  @Autowired
  public ExternalProcessController(ExternalProcessService externalProcessService) {
    this.externalProcessService = externalProcessService;
  }

  @PostMapping
  public ResponseEntity<ExternalProcess> createExternalProcess(
      @RequestBody ExternalProcess externalProcess) {
    ExternalProcess createdProcess = externalProcessService.createExternalProcess(externalProcess);
    return new ResponseEntity<>(createdProcess, HttpStatus.CREATED);
  }

  @GetMapping
  public ResponseEntity<List<ExternalProcess>> getAllExternalProcesses() {
    List<ExternalProcess> processes = externalProcessService.getAllExternalProcesses();
    return new ResponseEntity<>(processes, HttpStatus.OK);
  }

  @GetMapping("/{id}")
  public ResponseEntity<ExternalProcess> getExternalProcessById(@PathVariable Long id) {
    ExternalProcess process = externalProcessService.getExternalProcessById(id);
    return new ResponseEntity<>(process, HttpStatus.OK);
  }

  @PutMapping("/{id}")
  public ResponseEntity<ExternalProcess> updateExternalProcess(
      @PathVariable Long id, @RequestBody ExternalProcess externalProcess) {
    ExternalProcess updatedProcess =
        externalProcessService.updateExternalProcess(id, externalProcess);
    if (updatedProcess != null) {
      return new ResponseEntity<>(updatedProcess, HttpStatus.OK);
    } else {
      return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteExternalProcess(@PathVariable Long id) {
    boolean deleted = externalProcessService.deleteExternalProcess(id);
    if (deleted) {
      return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    } else {
      return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
  }

  @PatchMapping("/{id}/enable")
  public ResponseEntity<ExternalProcess> enableExternalProcess(@PathVariable Long id) {
    ExternalProcess enabledProcess = externalProcessService.changeProcessState(id, true);
    if (enabledProcess != null) {
      return new ResponseEntity<>(enabledProcess, HttpStatus.OK);
    } else {
      return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
  }

  @PatchMapping("/{id}/disable")
  public ResponseEntity<ExternalProcess> disableExternalProcess(@PathVariable Long id) {
    ExternalProcess disabledProcess = externalProcessService.changeProcessState(id, false);
    if (disabledProcess != null) {
      return new ResponseEntity<>(disabledProcess, HttpStatus.OK);
    } else {
      return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
  }

  @GetMapping("/name/{processName}") // Using a path variable
  public ResponseEntity<ExternalProcess> getExternalProcessByName(
      @PathVariable("processName") String processName) {
    ExternalProcess process = externalProcessService.getExternalProcessByName(processName);
    return new ResponseEntity<>(process, HttpStatus.OK);
  }
}
