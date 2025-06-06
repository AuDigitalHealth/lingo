package au.gov.digitalhealth.lingo.service.fhir;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.service.fhir.FhirParameters.Parameter;
import au.gov.digitalhealth.lingo.service.fhir.FhirParameters.Parameter.Part;
import au.gov.digitalhealth.lingo.util.CacheConstants;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
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
      unless = "#result == null || #result.pt == null || #result.pt.term == null")
  public Mono<SnowstormConceptMini> getConcept(String code, String system) {
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
              return snowstormConceptMini;
            });
  }
}
