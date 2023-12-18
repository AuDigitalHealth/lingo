package com.csiro.tickets;

import java.util.Objects;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdditionalFieldTypeDto {

  private Long id;

  private String name;

  private String description;

  private AdditionalFieldTypeDto.Type type;

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    if (!super.equals(o)) {
      return false;
    }
    AdditionalFieldTypeDto that = (AdditionalFieldTypeDto) o;
    return Objects.equals(name, that.name)
        && Objects.equals(description, that.description)
        && Objects.equals(type, that.type);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), name, description, type);
  }

  public enum Type {
    DATE,
    NUMBER,
    STRING,
    LIST
  }
}
