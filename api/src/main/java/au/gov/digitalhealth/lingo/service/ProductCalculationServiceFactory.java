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

import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.NutritionalProductDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.lingo.product.details.VaccineProductDetails;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ProductCalculationServiceFactory {

  private final Map<Class<? extends ProductDetails>, ProductCalculationService<?>> serviceMap;

  public ProductCalculationServiceFactory(
      ProductCalculationService<MedicationProductDetails> medicationProductCalculationService,
      ProductCalculationService<DeviceProductDetails> deviceProductCalculationService) {

    Map<Class<? extends ProductDetails>, ProductCalculationService<?>> map = new HashMap<>();
    map.put(MedicationProductDetails.class, medicationProductCalculationService);
    map.put(VaccineProductDetails.class, medicationProductCalculationService);
    map.put(NutritionalProductDetails.class, medicationProductCalculationService);
    map.put(DeviceProductDetails.class, deviceProductCalculationService);
    this.serviceMap = Collections.unmodifiableMap(map);
  }

  /**
   * Returns the calculation service for the specified product details class.
   *
   * @param productDetailsClass the class of product details
   * @param <T> the type of product details
   * @return the appropriate calculation service
   */
  @SuppressWarnings("unchecked")
  public <T extends ProductDetails> ProductCalculationService<T> getCalculationService(
      Class<T> productDetailsClass) {
    ProductCalculationService<? extends ProductDetails> service =
        serviceMap.get(productDetailsClass);
    if (service == null) {
      throw new IllegalArgumentException(
          "No service found for product details type: " + productDetailsClass.getName());
    }
    return (ProductCalculationService<T>) service;
  }
}
