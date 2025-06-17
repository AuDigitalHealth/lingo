package au.gov.digitalhealth.lingo.product;

import au.gov.digitalhealth.lingo.util.InactivationReason;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OriginalNode {
  private Node node;
  private InactivationReason inactivationReason;
  private boolean referencedByOtherProducts;

  @JsonProperty(value = "conceptId", access = JsonProperty.Access.READ_ONLY)
  public String getConceptId() {
    return node.getConceptId();
  }
}
