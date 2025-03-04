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
