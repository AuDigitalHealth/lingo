package com.csiro.snomio.exception;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import java.util.Collection;
import java.util.stream.Collectors;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class SingleConceptExpectedProblem extends SnomioProblem {

  final transient int size;

  public SingleConceptExpectedProblem(
      String branch, String ecl, Collection<SnowstormConceptMini> concepts) {
    super(
        "single-concept-ecl",
        "Single concept expected from ECL",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Expected a single concept ecl '"
            + ecl
            + "' on branch '"
            + branch
            + "' but found "
            + concepts.size());
    this.size = concepts.size();
  }

  public SingleConceptExpectedProblem(String message, int size) {
    super("single-concept", "Single concept expected", HttpStatus.INTERNAL_SERVER_ERROR, message);
    this.size = size;
  }

  public SingleConceptExpectedProblem(Collection<SnowstormConceptMini> concepts, String message) {
    super(
        "single-concept",
        "Single concept expected",
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Expected a single concept but found "
            + concepts.stream()
                .map(SnowstormConceptMini::getConceptId)
                .collect(Collectors.joining())
            + " - "
            + message);
    this.size = concepts.size();
  }
}
