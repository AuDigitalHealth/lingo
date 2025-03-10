package au.gov.digitalhealth.lingo.product.details;

import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.product.details.properties.ReferenceSet;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public abstract class PackageProductDetailsBase extends ProductBaseDto {
  List<@Valid ExternalIdentifier> externalIdentifiers = new ArrayList<>();
  List<@Valid ReferenceSet> referenceSets = new ArrayList<>();
  List<@Valid NonDefiningProperty> nonDefiningProperties = new ArrayList<>();
}
