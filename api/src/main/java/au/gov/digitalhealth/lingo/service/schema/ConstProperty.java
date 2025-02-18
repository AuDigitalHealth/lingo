package au.gov.digitalhealth.lingo.service.schema;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ConstProperty extends Property {
  String type = "string";

  @JsonProperty("const")
  String constant;

  public static Property create(@NotBlank String name) {
    ConstProperty property = new ConstProperty();
    property.setConstant(name);
    return property;
  }
}
