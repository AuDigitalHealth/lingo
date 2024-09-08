package com.csiro.eclrefset.model.addorremovequeryresponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddRemoveItem {
  private String conceptId;
  private boolean active;
  private String definitionStatus;
  private String moduleId;
  private String effectiveTime;
  private Term fsn;
  private Term pt;
  private String id;
  private String idAndFsnTerm;
}
