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
package au.gov.digitalhealth.lingo.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for device name composition in {@link DeviceProductCalculationService}. Covers the two
 * corrections that align device names with the HSE gold: the ATM is the bare brand (trailing
 * "(brand)" tag stripped), and device packs count as "(N device(s))" rather than the AMT-style ", N
 * unit".
 */
class DeviceProductCalculationServiceNameTest {

  @Test
  void stripBrandTagRemovesTrailingBrandTagOnly() {
    assertThat(DeviceProductCalculationService.stripBrandTag("4Sure B-Ketone (brand)"))
        .isEqualTo("4Sure B-Ketone");
    assertThat(DeviceProductCalculationService.stripBrandTag("4Sure B-Ketone"))
        .isEqualTo("4Sure B-Ketone");
    assertThat(DeviceProductCalculationService.stripBrandTag(null)).isNull();
  }

  @Test
  void pluraliseHandlesTheCountWord() {
    assertThat(DeviceProductCalculationService.pluralise("device", new BigDecimal("10")))
        .isEqualTo("devices");
    assertThat(DeviceProductCalculationService.pluralise("device", BigDecimal.ONE))
        .isEqualTo("device");
    assertThat(DeviceProductCalculationService.pluralise("patch", new BigDecimal("2")))
        .isEqualTo("patches");
  }

  @Test
  void formatDevicePackTermMatchesGold() {
    assertThat(
            DeviceProductCalculationService.formatDevicePackTerm(
                "Blood ketone testing strips", new BigDecimal("10"), "Device"))
        .isEqualTo("Blood ketone testing strips (10 devices)");
    assertThat(DeviceProductCalculationService.formatDevicePackTerm("X", BigDecimal.ONE, "Device"))
        .isEqualTo("X (1 device)");
    // Unit-of-presentation count carries no unit word.
    assertThat(DeviceProductCalculationService.formatDevicePackTerm("X", new BigDecimal("5"), null))
        .isEqualTo("X (5)");
  }
}
