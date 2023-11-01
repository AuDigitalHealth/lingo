package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormAxiomComponent;
import com.csiro.snomio.util.PartionIdentifier;
import com.csiro.snomio.validation.ValidSctId;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NewConceptDetails {
  @NotNull UUID conceptId = UUID.randomUUID();

  @ValidSctId(partitionIdentifier = PartionIdentifier.CONCEPT)
  String specifiedConceptId;

  @NotNull @NotEmpty String fullySpecifiedName;
  @NotNull @NotEmpty String preferredTerm;
  @NotNull @NotEmpty String semanticTag;
  @NotNull @NotEmpty Set<SnowstormAxiomComponent> axioms = new HashSet<>();
}
