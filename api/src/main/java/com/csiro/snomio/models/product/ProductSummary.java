package com.csiro.snomio.models.product;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.csiro.snowstorm_client.model.SnowstormConceptMiniComponent;
import com.csiro.snomio.util.SnowstormDtoUtil;
import java.util.HashSet;
import java.util.Set;
import lombok.Data;

/**
 * "N-box" model DTO listing a set of nodes and edges between them where the nodes and edges have
 * labels indicating their type.
 */
@Data
public class ProductSummary {

  SnowstormConceptMini subject;

  Set<Node> nodes = new HashSet<>();
  Set<Edge> edges = new HashSet<>();

  public void addNode(SnowstormConceptMiniComponent conceptSummary, String label) {
    nodes.add(new Node(conceptSummary, label));
  }

  public void addNode(SnowstormConceptMini mini, String label) {
    addNode(SnowstormDtoUtil.fromMini(mini), label);
  }

  public void addEdge(String source, String target, String type) {
    edges.add(new Edge(source, target, type));
  }
}
