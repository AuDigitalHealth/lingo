package au.gov.digitalhealth.tickets.service;

import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.models.ExternalProcess;
import au.gov.digitalhealth.tickets.repository.ExternalProcessRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ExternalProcessService {

  private final ExternalProcessRepository externalProcessRepository;

  @Autowired
  public ExternalProcessService(ExternalProcessRepository externalProcessRepository) {
    this.externalProcessRepository = externalProcessRepository;
  }

  public ExternalProcess createExternalProcess(ExternalProcess externalProcess) {
    return externalProcessRepository.save(externalProcess);
  }

  public List<ExternalProcess> getAllExternalProcesses() {
    return externalProcessRepository.findAll();
  }

  public ExternalProcess getExternalProcessByName(String processName) {
    return externalProcessRepository
        .findByProcessName(processName)
        .orElseThrow(
            () ->
                new ResourceNotFoundProblem(
                    String.format("External Process with name '%s' not found", processName)));
  }

  public ExternalProcess getExternalProcessById(Long id) {
    return externalProcessRepository
        .findById(id)
        .orElseThrow(
            () ->
                new ResourceNotFoundProblem(
                    String.format("External Process with ID '%s' not found", id)));
  }

  public ExternalProcess updateExternalProcess(Long id, ExternalProcess externalProcess) {
    ExternalProcess processToUpdate = getExternalProcessById(id);

    processToUpdate.setProcessName(externalProcess.getProcessName());
    processToUpdate.setEnabled(externalProcess.isEnabled());
    return externalProcessRepository.save(processToUpdate);
  }

  public boolean deleteExternalProcess(Long id) {
    ExternalProcess processToDelete = getExternalProcessById(id);
    externalProcessRepository.delete(processToDelete);
    return true;
  }

  public ExternalProcess changeProcessState(Long id, boolean state) {
    ExternalProcess processToUpdate = getExternalProcessById(id);
    processToUpdate.setEnabled(state);
    return externalProcessRepository.save(processToUpdate);
  }
}
