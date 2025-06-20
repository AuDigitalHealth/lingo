package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
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
