package au.gov.digitalhealth.lingo.service.schema;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ObjectProperty extends Property {
  String type = "object";
  Map<String, Property> properties = new HashMap<>();
  List<String> required = new ArrayList<>();
}
