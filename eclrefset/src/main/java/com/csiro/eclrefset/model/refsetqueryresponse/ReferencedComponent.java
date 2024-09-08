package com.csiro.eclrefset.model.refsetqueryresponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferencedComponent {

  String conceptId;
  boolean active;
  String definitionStatus;
  String moduleId;
  Fsn fsn;
  Pt pt;
  String id;
}
