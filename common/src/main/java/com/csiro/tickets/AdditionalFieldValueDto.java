package com.csiro.tickets;

import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@Data
@ToString(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class AdditionalFieldValueDto extends BaseAuditableDto implements Serializable {

  private AdditionalFieldTypeDto additionalFieldType;

  private String valueOf;
}
