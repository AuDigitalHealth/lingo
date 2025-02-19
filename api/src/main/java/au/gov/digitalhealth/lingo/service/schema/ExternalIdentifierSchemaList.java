package au.gov.digitalhealth.lingo.service.schema;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Data
public class ExternalIdentifierSchemaList {
  String type = "object";
  List<IdentifierSchema> oneOf = new ArrayList<>();
}
