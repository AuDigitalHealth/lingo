package au.gov.digitalhealth.lingo.service.schema;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class EnumProperty extends Property {
  String type = "string";

  @JsonProperty("enum")
  List<String> enumValues = new ArrayList<>();

  @JsonProperty("default")
  String defaultEnumValue;
}
