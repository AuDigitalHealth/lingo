package au.gov.digitalhealth.lingo.product.details.properties;

import java.util.List;

public record AdditionalProperty(
    String code, String codeSystem, String value, List<SubAdditionalProperty> subProperties) {}
