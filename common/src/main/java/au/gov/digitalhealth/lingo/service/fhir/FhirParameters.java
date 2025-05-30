package au.gov.digitalhealth.lingo.service.fhir;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Data;

@Data
public class FhirParameters {
  @JsonProperty("resourceType")
  private String resourceType;

  @JsonProperty("parameter")
  private List<Parameter> parameter;

  @Data
  public static class Parameter {
    @JsonProperty("name")
    private String name;

    @JsonProperty("valueCode")
    private String valueCode;

    @JsonProperty("valueString")
    private String valueString;

    @JsonProperty("valueUri")
    private String valueUri;

    @JsonProperty("valueBoolean")
    private Boolean valueBoolean;

    @JsonProperty("part")
    private List<Part> part;

    @Data
    public static class Part {
      @JsonProperty("name")
      private String name;

      @JsonProperty("valueCode")
      private String valueCode;

      @JsonProperty("valueString")
      private String valueString;

      @JsonProperty("valueBoolean")
      private Boolean valueBoolean;

      @JsonProperty("valueCoding")
      private Coding valueCoding;

      @Data
      public static class Coding {
        @JsonProperty("system")
        private String system;

        @JsonProperty("code")
        private String code;
      }
    }
  }
}
