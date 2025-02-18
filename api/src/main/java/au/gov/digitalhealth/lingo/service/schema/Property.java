package au.gov.digitalhealth.lingo.service.schema;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Data
public abstract class Property {
  String title;
}
