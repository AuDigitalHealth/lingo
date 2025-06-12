package au.gov.digitalhealth.lingo.service.fhir;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.service.fhir.FhirParameters.Parameter;
import au.gov.digitalhealth.lingo.service.fhir.FhirParameters.Parameter.Part;
import au.gov.digitalhealth.lingo.util.CacheConstants;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class FhirClient {
  private final WebClient client;

  public FhirClient(@Qualifier("fhirApiClient") WebClient client) {
    this.client = client;
  }

  private static boolean isInActive(FhirParameters parameters) {
    return parameters.getParameter().stream()
        .filter(param -> "property".equals(param.getName()))
        .filter(
            param ->
                param.getPart().stream()
                    .anyMatch(
                        part ->
                            "inactive".equals(part.getValueCode())
                                && "code".equals(part.getName())))
        .flatMap(param -> param.getPart().stream())
        .filter(part -> "value".equals(part.getName()))
        .map(Part::getValueBoolean)
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("No active status found in FHIR parameters"));
  }

  private static String getDisplayName(FhirParameters parameters) {
    return parameters.getParameter().stream()
        .filter(param -> "display".equals(param.getName()))
        .map(Parameter::getValueString)
        .findFirst()
        .orElseThrow(() -> new IllegalStateException("No display name found in FHIR parameters"));
  }

  @Cacheable(
      value = CacheConstants.FHIR_CONCEPTS,
      key = "#code + '_' + #system",
      unless = "#result == null")
  public Mono<Pair<SnowstormConceptMini, Map<String, String>>> getConcept(
      String code, String system) {
    if (code == null || code.isEmpty()) {
      return Mono.error(new IllegalArgumentException("Code must not be null or empty"));
    }

    if (system == null || system.isEmpty()) {
      return Mono.error(new IllegalArgumentException("System must not be null or empty"));
    }

    return client
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path("/CodeSystem/$lookup")
                    .queryParam("code", code)
                    .queryParam("system", system)
                    .queryParam("property", "*")
                    .build())
        .retrieve()
        .bodyToMono(FhirParameters.class)
        .map(
            parameters -> {
              SnowstormConceptMini snowstormConceptMini = new SnowstormConceptMini();
              snowstormConceptMini.setConceptId(code);
              snowstormConceptMini.setId(code);
              snowstormConceptMini.setActive(!isInActive(parameters));
              SnowstormTermLangPojo pt =
                  new SnowstormTermLangPojo().lang("en").term(getDisplayName(parameters));
              snowstormConceptMini.setPt(pt);
              SnowstormTermLangPojo fsn =
                  new SnowstormTermLangPojo().lang("en").term(getDisplayName(parameters));
              snowstormConceptMini.setFsn(fsn);

              // Create the map of properties
              Map<String, String> propertyMap = new HashMap<>();

              // Process property parts
              parameters.getParameter().stream()
                  .filter(param -> "property".equals(param.getName()) && param.getPart() != null)
                  .forEach(
                      propertyParam -> {
                        // Find code part
                        Optional<Part> codePart =
                            propertyParam.getPart().stream()
                                .filter(part -> "code".equals(part.getName()))
                                .findFirst();

                        // Find value part
                        Optional<Part> valuePart =
                            propertyParam.getPart().stream()
                                .filter(part -> "value".equals(part.getName()))
                                .findFirst();

                        if (codePart.isPresent() && valuePart.isPresent()) {
                          String propertyCode = codePart.get().getValueAsString();
                          String propertyValue = valuePart.get().getValueAsString();

                          if (propertyCode != null && propertyValue != null) {
                            propertyMap.put(propertyCode, propertyValue);
                          }
                        }
                      });

              return Pair.of(snowstormConceptMini, propertyMap);
            });
  }
}
