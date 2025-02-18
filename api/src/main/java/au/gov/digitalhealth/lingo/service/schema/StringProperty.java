package au.gov.digitalhealth.lingo.service.schema;

import java.util.HashMap;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class StringProperty extends Property {
  String type = "string";
  String pattern;
  Map<String, String> errorMessage = new HashMap<>();
}
