package com.csiro.snomio.controllers;

import com.csiro.snomio.models.product.Edge;
import com.csiro.snomio.models.product.Node;
import com.csiro.snomio.models.product.ProductSummary;
import com.csiro.snomio.service.ProductService;
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
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(
    value = "/api",
    produces = {MediaType.APPLICATION_JSON_VALUE})
public class ProductsController {

  final ProductService productService;

  @Autowired
  public ProductsController(ProductService productService) {
    this.productService = productService;
  }

  @GetMapping("/{branch}/product-model/{productId}")
  @ResponseBody
  public ProductSummary getProductModel(@PathVariable String branch, @PathVariable Long productId) {
    return productService.getProductSummary(branch, productId.toString());
  }

  @GetMapping("/{branch}/product-model-graph/{productId}")
  @ResponseBody
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
      graph.append("  subgraph cluster_" + entry.getKey() + " {\n");
      graph.append("    label = \"" + entry.getKey() + "\";\n");
      for (Node node : entry.getValue()) {
        graph.append(
            "    "
                + node.getConcept().getConceptId()
                + " [label=\""
                + node.getConcept().getPt().getTerm()
                + "\"];\n");
      }
      graph.append("  }\n");
    }
    for (Edge edge : summary.getEdges()) {
      graph.append(
          "  "
              + edge.getSource()
              + " -> "
              + edge.getTarget()
              + " [label=\""
              + edge.getLabel()
              + "\" "
              + (edge.getLabel().equals(ProductService.IS_A_LABEL)
                  ? "arrowhead=empty"
                  : "style=dashed arrowhead=open")
              + "];\n");
    }
    return graph.append("}").toString();
  }
}
