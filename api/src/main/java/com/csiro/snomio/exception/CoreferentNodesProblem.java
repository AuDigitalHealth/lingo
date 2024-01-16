package com.csiro.snomio.exception;

import com.csiro.snomio.product.Node;
import org.springframework.http.HttpStatus;

public class CoreferentNodesProblem extends SnomioProblem {
  public CoreferentNodesProblem(Node o1, Node o2) {
    super(
        "coreferent-nodes",
        "Coreferent nodes",
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Nodes " + o1.getIdAndFsnTerm() + " and " + o2.getIdAndFsnTerm() + " are coreferent");
  }
}
