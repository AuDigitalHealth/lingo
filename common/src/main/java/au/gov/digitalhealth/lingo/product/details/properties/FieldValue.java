package au.gov.digitalhealth.lingo.product.details.properties;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import java.util.Set;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
public class FieldValue {
  String value;
  SnowstormConceptMini valueObject;
  String codeSystem;

  /** Additional properties from the target concept, purely for display purposes. */
  Set<AdditionalProperty> additionalProperties;
}
