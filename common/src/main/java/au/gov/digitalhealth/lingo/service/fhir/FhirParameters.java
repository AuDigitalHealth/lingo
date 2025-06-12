package au.gov.digitalhealth.lingo.service.fhir;

import au.gov.digitalhealth.lingo.service.fhir.FhirParameters.Parameter.Part.Coding;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
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

    @JsonProperty("valueBoolean")
    private Boolean valueBoolean;

    @JsonProperty("valueCoding")
    private Coding valueCoding;

    @JsonProperty("valueInteger")
    private Integer valueInteger;

    @JsonProperty("valueDecimal")
    private BigDecimal valueDecimal;

    @JsonProperty("valueDateTime")
    private String valueDateTime;

    @JsonProperty("valueUri")
    private String valueUri;

    @JsonProperty("part")
    private List<Part> part;

    public boolean hasValueString() {
      return valueString != null;
    }

    public boolean hasValueCode() {
      return valueCode != null;
    }

    public boolean hasValueBoolean() {
      return valueBoolean != null;
    }

    public boolean hasValueInteger() {
      return valueInteger != null;
    }

    public boolean hasValueDecimal() {
      return valueDecimal != null;
    }

    public boolean hasValueDateTime() {
      return valueDateTime != null;
    }

    public boolean hasValueUri() {
      return valueUri != null;
    }

    public boolean hasValueCoding() {
      return valueCoding != null;
    }

    public String getValueAsString() {
      if (hasValueString()) {
        return valueString;
      } else if (hasValueCode()) {
        return valueCode;
      } else if (hasValueBoolean()) {
        return valueBoolean.toString();
      } else if (hasValueInteger()) {
        return valueInteger.toString();
      } else if (hasValueDecimal()) {
        return valueDecimal.toString();
      } else if (hasValueDateTime()) {
        return valueDateTime;
      } else if (hasValueUri()) {
        return valueUri;
      } else if (hasValueCoding()) {
        return valueCoding.getCode();
      }
      return null;
    }

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

      @JsonProperty("valueInteger")
      private Integer valueInteger;

      @JsonProperty("valueDecimal")
      private BigDecimal valueDecimal;

      @JsonProperty("valueDateTime")
      private String valueDateTime;

      @JsonProperty("valueUri")
      private String valueUri;

      public boolean hasValueString() {
        return valueString != null;
      }

      public boolean hasValueCode() {
        return valueCode != null;
      }

      public boolean hasValueBoolean() {
        return valueBoolean != null;
      }

      public boolean hasValueInteger() {
        return valueInteger != null;
      }

      public boolean hasValueDecimal() {
        return valueDecimal != null;
      }

      public boolean hasValueDateTime() {
        return valueDateTime != null;
      }

      public boolean hasValueUri() {
        return valueUri != null;
      }

      public boolean hasValueCoding() {
        return valueCoding != null;
      }

      public String getValueAsString() {
        if (hasValueString()) {
          return valueString;
        } else if (hasValueCode()) {
          return valueCode;
        } else if (hasValueBoolean()) {
          return valueBoolean.toString();
        } else if (hasValueInteger()) {
          return valueInteger.toString();
        } else if (hasValueDecimal()) {
          return valueDecimal.toString();
        } else if (hasValueDateTime()) {
          return valueDateTime;
        } else if (hasValueUri()) {
          return valueUri;
        } else if (hasValueCoding()) {
          return valueCoding.getCode();
        }
        return null;
      }

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
