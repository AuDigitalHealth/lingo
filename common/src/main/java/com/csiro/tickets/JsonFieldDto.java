package com.csiro.tickets;

import com.fasterxml.jackson.databind.JsonNode;
import java.io.Serializable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

@Data
@ToString(callSuper = true)
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class JsonFieldDto extends BaseAuditableDto implements Serializable {

  private String name;

  private JsonNode value;
}
