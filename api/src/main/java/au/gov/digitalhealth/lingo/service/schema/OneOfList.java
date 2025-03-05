package au.gov.digitalhealth.lingo.service.schema;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Data
public class OneOfList {
  String type = "object";
  List<ObjectProperty> oneOf = new ArrayList<>();
}
