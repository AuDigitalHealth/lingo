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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import au.gov.digitalhealth.lingo.exception.ResourceAlreadyExists;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.tickets.helper.ExportPresetConfig;
import au.gov.digitalhealth.tickets.models.ExportPreset;
import au.gov.digitalhealth.tickets.repository.ExportPresetRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ExportPresetServiceTest {

  @Mock ExportPresetRepository exportPresetRepository;

  @InjectMocks ExportPresetService exportPresetService;

  @Test
  void createPreset_savesWhenNameIsUnique() {
    ExportPreset preset = preset("ADHA export");
    when(exportPresetRepository.findByName("ADHA export")).thenReturn(Optional.empty());
    when(exportPresetRepository.save(preset)).thenReturn(preset);

    assertThat(exportPresetService.createPreset(preset)).isSameAs(preset);
    verify(exportPresetRepository).save(preset);
  }

  @Test
  void createPreset_throwsWhenNameAlreadyExists() {
    ExportPreset preset = preset("ADHA export");
    when(exportPresetRepository.findByName("ADHA export")).thenReturn(Optional.of(preset("other")));

    assertThatThrownBy(() -> exportPresetService.createPreset(preset))
        .isInstanceOf(ResourceAlreadyExists.class);
    verify(exportPresetRepository, never()).save(any());
  }

  @Test
  void updatePreset_updatesNameAndConfig() {
    ExportPreset existing = preset("old");
    when(exportPresetRepository.findById(1L)).thenReturn(Optional.of(existing));
    when(exportPresetRepository.save(existing)).thenReturn(existing);

    ExportPreset update = preset("new");
    ExportPreset result = exportPresetService.updatePreset(1L, update);

    assertThat(result.getName()).isEqualTo("new");
    assertThat(result.getConfig()).isSameAs(update.getConfig());
    // The user-defined column order round-trips through the saved config.
    assertThat(result.getConfig().getColumnOrder()).containsExactly("title", "ticketNumber");
  }

  @Test
  void updatePreset_throwsWhenNotFound() {
    when(exportPresetRepository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> exportPresetService.updatePreset(99L, preset("x")))
        .isInstanceOf(ResourceNotFoundProblem.class);
  }

  @Test
  void deletePreset_deletesWhenFound() {
    ExportPreset existing = preset("ADHA export");
    when(exportPresetRepository.findById(1L)).thenReturn(Optional.of(existing));

    exportPresetService.deletePreset(1L);

    verify(exportPresetRepository).delete(existing);
  }

  @Test
  void deletePreset_throwsWhenNotFound() {
    when(exportPresetRepository.findById(99L)).thenReturn(Optional.empty());

    assertThatThrownBy(() -> exportPresetService.deletePreset(99L))
        .isInstanceOf(ResourceNotFoundProblem.class);
    verify(exportPresetRepository, never()).delete(any());
  }

  private static ExportPreset preset(String name) {
    ExportPreset preset = new ExportPreset();
    preset.setName(name);
    preset.setConfig(
        ExportPresetConfig.builder()
            .columns(List.of("ticketNumber", "title"))
            .columnOrder(List.of("title", "ticketNumber"))
            .build());
    return preset;
  }
}
