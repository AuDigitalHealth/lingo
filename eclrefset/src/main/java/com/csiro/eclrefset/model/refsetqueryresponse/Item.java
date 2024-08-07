package com.csiro.eclrefset.model.refsetqueryresponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Item {

    boolean active;
    String moduleId;
    boolean released;
    String memberId;
    String refsetId;
    AdditionalFields additionalFields;
    ReferencedComponent referencedComponent;
}
