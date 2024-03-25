package com.csiro.snomio.controllers;

import com.csiro.snomio.product.Edge;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.ProductSummary;
import com.csiro.snomio.service.ProductSummaryService;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class ProductsController {

  final ProductSummaryService productService;

  @Autowired
  public ProductsController(ProductSummaryService productService) {
    this.productService = productService;
  }

  @GetMapping("/{branch}/product-model/{productId}")
  public ProductSummary getProductModel(@PathVariable String branch, @PathVariable Long productId) {
    return productService.getProductSummary(branch, productId.toString());
  }

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
        graph
            .append("    ")
            .append(node.getConcept().getConceptId())
            .append(" [label=\"")
            .append(node.getConcept().getPt().getTerm())
            .append("\"];\n");
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
