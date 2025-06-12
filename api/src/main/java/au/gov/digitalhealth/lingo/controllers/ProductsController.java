/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.lingo.controllers;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormTermLangPojo;
import au.gov.digitalhealth.lingo.aspect.LogExecutionTime;
import au.gov.digitalhealth.lingo.product.Edge;
import au.gov.digitalhealth.lingo.product.Node;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductPropertiesUpdateRequest;
import au.gov.digitalhealth.lingo.service.ProductSummaryService;
import au.gov.digitalhealth.lingo.service.ProductUpdateService;
import au.gov.digitalhealth.lingo.service.TaskManagerService;
import jakarta.validation.Valid;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class ProductsController {

  final ProductSummaryService productService;
  final TaskManagerService taskManagerService;
  final ProductUpdateService productUpdateService;

  public ProductsController(
      ProductSummaryService productService,
      TaskManagerService taskManagerService,
      ProductUpdateService productUpdateService) {
    this.productService = productService;
    this.taskManagerService = taskManagerService;
    this.productUpdateService = productUpdateService;
  }

  @LogExecutionTime
  @GetMapping("/{branch}/product-model/{productId}")
  public ProductSummary getProductModel(@PathVariable String branch, @PathVariable Long productId) {
    return productService.getProductSummary(branch, productId.toString());
  }

  @LogExecutionTime
  @PutMapping("/{branch}/product-model/{conceptId}/descriptions")
  public ResponseEntity<SnowstormConceptMini> updateProductDescriptions(
      @PathVariable String branch,
      @PathVariable Long conceptId,
      @RequestBody @Valid ProductDescriptionUpdateRequest productDescriptionUpdateRequest) {
    taskManagerService.validateTaskState(branch);
    return new ResponseEntity<>(
        productUpdateService.updateProductDescriptions(
            branch, String.valueOf(conceptId), productDescriptionUpdateRequest),
        HttpStatus.OK);
  }

  @LogExecutionTime
  @PutMapping("/{branch}/product-model/{conceptId}/properties")
  public ResponseEntity<Collection<NonDefiningBase>> updateProductProperties(
      @PathVariable String branch,
      @PathVariable Long conceptId,
      @RequestBody @Valid ProductPropertiesUpdateRequest productPropertiesUpdateRequest)
      throws InterruptedException {
    taskManagerService.validateTaskState(branch);
    return new ResponseEntity<>(
        productUpdateService.updateProductProperties(
            branch, String.valueOf(conceptId), productPropertiesUpdateRequest),
        HttpStatus.OK);
  }

  @LogExecutionTime
  @GetMapping("/{branch}/product-model-graph/{productId}")
  public String getProductModelGraph(@PathVariable String branch, @PathVariable Long productId) {

    ProductSummary summary = productService.getProductSummary(branch, productId.toString());

    Map<String, Set<Node>> nodesByType = new HashMap<>();

    summary
        .getNodes()
        .forEach(
            node -> nodesByType.computeIfAbsent(node.getLabel(), k -> new HashSet<>()).add(node));

    StringBuilder graph = new StringBuilder();
    graph.append("digraph G {\n   rankdir=\"BT\"\n");
    for (Entry<String, Set<Node>> entry : nodesByType.entrySet()) {
      graph.append("  subgraph cluster_").append(entry.getKey()).append(" {\n");
      graph.append("    label = \"").append(entry.getKey()).append("\";\n");
      for (Node node : entry.getValue()) {
        SnowstormTermLangPojo pt = node.getConcept().getPt();
        if (pt != null) {
          graph
              .append("    ")
              .append(node.getConcept().getConceptId())
              .append(" [label=\"")
              .append(pt.getTerm())
              .append("\"];\n");
        }
      }
      graph.append("  }\n");
    }
    for (Edge edge : summary.getEdges()) {
      graph
          .append("  ")
          .append(edge.getSource())
          .append(" -> ")
          .append(edge.getTarget())
          .append(" [label=\"")
          .append(edge.getLabel())
          .append("\" ")
          .append(
              edge.getLabel().equals(ProductSummaryService.IS_A_LABEL)
                  ? "arrowhead=empty"
                  : "style=dashed arrowhead=open")
          .append("];\n");
    }
    return graph.append("}").toString();
  }
}
