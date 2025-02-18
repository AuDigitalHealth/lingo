package au.gov.digitalhealth.lingo.service.schema;

import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ArrayProperty extends Property {
  String type = "array";
  Property items;
}
