package com.csiro.tickets;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@SuperBuilder
@Data
@ToString(callSuper = true)
@AllArgsConstructor
@NoArgsConstructor
public class AdditionalFieldTypeDto implements Serializable {

  @EqualsAndHashCode.Exclude private Long id;

  private String name;

  private String description;

  private AdditionalFieldTypeDto.Type type;

  public enum Type {
    DATE,
    NUMBER,
    STRING,
    LIST
  }
}
