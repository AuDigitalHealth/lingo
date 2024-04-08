package com.csiro.snomio.service;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.product.Edge;
import com.csiro.snomio.product.Node;
import com.csiro.snomio.product.ProductSummary;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Service for product-centric operations */
@Service
@Log
public class ProductSummaryService {

  public static final String TPP_FOR_CTPP_ECL = "(> <id>) and ^ 929360041000036105";
  public static final String MPP_FOR_CTPP_ECL =
      "((> <id>) and ^ 929360081000036101) minus >((> <id>) and ^ 929360081000036101)";
  public static final String TP_FOR_PRODUCT_ECL = ">> <id>.774158006";
  public static final String TPUU_FOR_CTPP_ECL =
      "(>> ((<id>.774160008) or (<id>.999000081000168101))) and (^ 929360031000036100)";
  public static final String MPUU_FOR_MPP_ECL =
      "(>> ((<id>.774160008) or (<id>.999000081000168101)) and ^ 929360071000036103) minus >(>> ((<id>.774160008) or (<id>.999000081000168101)) and ^ 929360071000036103)";
  public static final String MPUU_FOR_TPUU_ECL =
      "((> <id>) and ^ 929360071000036103) minus >((> <id>) and ^ 929360071000036103)";
  public static final String MP_FOR_TPUU_ECL =
      "((> <id>) and ^ 929360061000036106) minus >((> <id>) and ^ 929360061000036106)";
  public static final String CONTAINS_LABEL = "contains";
  public static final String HAS_PRODUCT_NAME_LABEL = "has product name";
  public static final String CTPP_LABEL = "CTPP";
  public static final String TPP_LABEL = "TPP";
  public static final String MPP_LABEL = "MPP";
  public static final String IS_A_LABEL = "is a";
  public static final String TP_LABEL = "TP";
  public static final String TPUU_LABEL = "TPUU";
  public static final String MPUU_LABEL = "MPUU";
  public static final String MP_LABEL = "MP";
  private static final String SUBPACK_FROM_PARENT_PACK_ECL =
      "((<id>.999000011000168107) or (<id>.999000111000168106))";
  private final SnowstormClient snowStormApiClient;
  private final NodeGeneratorService nodeGeneratorService;

  @Autowired
  ProductSummaryService(
      SnowstormClient snowStormApiClient, NodeGeneratorService nodeGeneratorService) {
    this.snowStormApiClient = snowStormApiClient;
    this.nodeGeneratorService = nodeGeneratorService;
  }

  public static Set<Edge> getTransitiveEdges(
      ProductSummary productSummary, Set<Edge> transitiveContainsEdges) {
    int beginningTransitiveEdgeSize = transitiveContainsEdges.size();

    for (Edge edge : productSummary.getEdges()) {
      for (Edge edge2 : productSummary.getEdges()) {
        if (edge2.getSource().equals(edge.getTarget())) {
          if (edge.getLabel().equals(CONTAINS_LABEL)
              && (edge2.getLabel().equals(CONTAINS_LABEL) || edge2.getLabel().equals(IS_A_LABEL))) {
            // CONTAINS_LABEL o CONTAINS_LABEL -> CONTAINS_LABEL
            // CONTAINS_LABEL o IS_A_LABEL -> CONTAINS_LABEL
            transitiveContainsEdges.add(
                new Edge(edge.getSource(), edge2.getTarget(), CONTAINS_LABEL));
          } else if (edge.getLabel().equals(IS_A_LABEL)
              && edge2.getLabel().equals(CONTAINS_LABEL)) {
            // IS_A_LABEL o CONTAINS_LABEL -> CONTAINS_LABEL
            transitiveContainsEdges.add(
                new Edge(edge.getSource(), edge2.getTarget(), CONTAINS_LABEL));
          } else if (edge.getLabel().equals(IS_A_LABEL) && edge2.getLabel().equals(IS_A_LABEL)) {
            // IS_A_LABEL o IS_A_LABEL -> IS_A_LABEL
            transitiveContainsEdges.add(new Edge(edge.getSource(), edge2.getTarget(), IS_A_LABEL));
          }
        }
      }
    }

    productSummary.getEdges().addAll(transitiveContainsEdges);

    if (beginningTransitiveEdgeSize != transitiveContainsEdges.size()) {
      return getTransitiveEdges(productSummary, transitiveContainsEdges);
    }
    return transitiveContainsEdges;
  }

  public ProductSummary getProductSummary(String branch, String productId) {
    log.info("Getting product model for " + productId + " on branch " + branch);
    // TODO validate productId is a CTPP
    // TODO handle error responses from Snowstorm

    log.fine("Adding concepts and relationships for " + productId);
    final ProductSummary productSummary = new ProductSummary();

    addConceptsAndRelationshipsForProduct(branch, productId, null, null, null, productSummary)
        .join();

    log.fine("Calculating transitive relationships for product model for " + productId);

    final Set<Node> nodes = new HashSet<>();
    productSummary
        .getNodes()
        .forEach(
            n ->
                productSummary
                    .getNodes()
                    .forEach(
                        n2 -> {
                          if (n != n2
                              && !nodes.contains(n)
                              && !nodes.contains(n2)
                              && !productSummary.containsEdgeBetween(n, n2)) {
                            nodes.add(n);
                            nodes.add(n2);
                          }
                        }));

    String nodeIdOrClause =
        nodes.stream().map(Node::getConceptId).collect(Collectors.joining(" OR "));

    Set<CompletableFuture<ProductSummary>> futures = new HashSet<>();
    productSummary.getNodes().stream()
        .filter(
            n ->
                !n.getLabel().equals(CTPP_LABEL)
                    && !n.getLabel().equals(TPUU_LABEL)
                    && !n.getLabel().equals(TP_LABEL))
        .forEach(
            n ->
                futures.add(
                    nodeGeneratorService.addTransitiveEdges(
                        branch, n, nodeIdOrClause, productSummary)));
    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    Set<Edge> transitiveContainsEdges = getTransitiveEdges(productSummary, new HashSet<>());

    productSummary.getEdges().addAll(transitiveContainsEdges);

    log.info("Done product model for " + productId + " on branch " + branch);
    return productSummary;
  }

  CompletableFuture<ProductSummary> addConceptsAndRelationshipsForProduct(
      String branch,
      String productId,
      String outerCtppId,
      String outerTppId,
      String outerMppId,
      ProductSummary productSummary) {

    Set<CompletableFuture> futures = Collections.synchronizedSet(new HashSet<>());

    CompletableFuture<Node> ctppNode =
        nodeGeneratorService
            .lookUpNode(branch, productId, CTPP_LABEL)
            .thenApply(
                c -> {
                  productSummary.addNode(c);
                  if (productSummary.getSubject() == null) {
                    // set this for the first, outermost CTPP
                    productSummary.setSubject(c);
                  }
                  return c;
                });
    futures.add(ctppNode);

    CompletableFuture<Node> tppNode =
        nodeGeneratorService
            .lookUpNode(branch, Long.valueOf(productId), TPP_FOR_CTPP_ECL, TPP_LABEL)
            .thenApply(
                c -> {
                  productSummary.addNode(c);
                  return c;
                });
    futures.add(tppNode);

    CompletableFuture<Node> mppNode =
        nodeGeneratorService
            .lookUpNode(branch, Long.valueOf(productId), MPP_FOR_CTPP_ECL, MPP_LABEL)
            .thenApply(
                c -> {
                  productSummary.addNode(c);
                  return c;
                });
    futures.add(mppNode);

    futures.add(
        CompletableFuture.allOf(mppNode, tppNode, ctppNode)
            .thenApply(
                v -> {
                  productSummary.addEdge(
                      ctppNode.join().getConcept().getConceptId(),
                      tppNode.join().getConcept().getConceptId(),
                      IS_A_LABEL);
                  productSummary.addEdge(
                      tppNode.join().getConcept().getConceptId(),
                      mppNode.join().getConcept().getConceptId(),
                      IS_A_LABEL);
                  return null;
                }));

    if (outerCtppId != null) {
      // no subpacks of subpacks
      productSummary.addEdge(outerCtppId, productId, CONTAINS_LABEL);

      futures.add(
          CompletableFuture.allOf(mppNode, tppNode)
              .thenApply(
                  v -> {
                    productSummary.addEdge(
                        outerTppId, tppNode.join().getConcept().getConceptId(), CONTAINS_LABEL);
                    productSummary.addEdge(
                        outerMppId, mppNode.join().getConcept().getConceptId(), CONTAINS_LABEL);
                    return null;
                  }));
    } else {
      List<String> subpackCtppIds =
          snowStormApiClient
              .getConceptsFromEcl(branch, SUBPACK_FROM_PARENT_PACK_ECL, productId, 0, 100)
              .stream()
              .map(SnowstormConceptMini::getConceptId)
              .toList();

      futures.addAll(
          subpackCtppIds.stream()
              .map(
                  subpackCtppId ->
                      addConceptsAndRelationshipsForProduct(
                          branch,
                          subpackCtppId,
                          productId,
                          tppNode.join().getConcept().getConceptId(),
                          mppNode.join().getConcept().getConceptId(),
                          productSummary))
              .toList());
    }

    futures.add(
        nodeGeneratorService
            .lookUpNode(branch, Long.valueOf(productId), TP_FOR_PRODUCT_ECL, TP_LABEL)
            .thenApply(
                c -> {
                  productSummary.addNode(c);
                  productSummary.addEdge(
                      tppNode.join().getConcept().getConceptId(),
                      c.getConcept().getConceptId(),
                      HAS_PRODUCT_NAME_LABEL);
                  productSummary.addEdge(
                      ctppNode.join().getConcept().getConceptId(),
                      c.getConcept().getConceptId(),
                      HAS_PRODUCT_NAME_LABEL);
                  return c;
                }));

    CompletableFuture<List<Node>> tpuusForCtpp =
        nodeGeneratorService
            .lookUpNodes(branch, productId, TPUU_FOR_CTPP_ECL, TPUU_LABEL)
            .thenApply(
                c -> {
                  c.forEach(
                      concept -> {
                        productSummary.addNode(concept);
                        productSummary.addEdge(
                            ctppNode.join().getConceptId(), concept.getConceptId(), CONTAINS_LABEL);
                        productSummary.addEdge(
                            tppNode.join().getConceptId(), concept.getConceptId(), CONTAINS_LABEL);
                        CompletableFuture<Node> tpuuTp =
                            nodeGeneratorService
                                .lookUpNode(
                                    branch,
                                    Long.valueOf(concept.getConceptId()),
                                    TP_FOR_PRODUCT_ECL,
                                    TP_LABEL)
                                .thenApply(
                                    tp -> {
                                      productSummary.addEdge(
                                          concept.getConceptId(),
                                          tp.getConcept().getConceptId(),
                                          HAS_PRODUCT_NAME_LABEL);
                                      return tp;
                                    });
                        futures.add(tpuuTp);
                        CompletableFuture<List<Node>> mpuusForTpuu =
                            nodeGeneratorService
                                .lookUpNodes(
                                    branch, concept.getConceptId(), MPUU_FOR_TPUU_ECL, MPUU_LABEL)
                                .thenApply(
                                    mpuus -> {
                                      mpuus.forEach(
                                          mpuu -> {
                                            productSummary.addNode(mpuu);
                                            productSummary.addEdge(
                                                concept.getConceptId(),
                                                mpuu.getConcept().getConceptId(),
                                                IS_A_LABEL);
                                            productSummary.addEdge(
                                                mppNode.join().getConceptId(),
                                                mpuu.getConcept().getConceptId(),
                                                CONTAINS_LABEL);
                                            productSummary.addEdge(
                                                tppNode.join().getConceptId(),
                                                mpuu.getConcept().getConceptId(),
                                                CONTAINS_LABEL);
                                            productSummary.addEdge(
                                                ctppNode.join().getConceptId(),
                                                mpuu.getConcept().getConceptId(),
                                                CONTAINS_LABEL);
                                          });
                                      return mpuus;
                                    });
                        futures.add(mpuusForTpuu);
                        CompletableFuture<List<Node>> mpsForTpuu =
                            nodeGeneratorService
                                .lookUpNodes(
                                    branch, concept.getConceptId(), MP_FOR_TPUU_ECL, MP_LABEL)
                                .thenApply(
                                    mps -> {
                                      mps.forEach(
                                          mp -> {
                                            productSummary.addNode(mp);
                                            productSummary.addEdge(
                                                concept.getConceptId(),
                                                mp.getConcept().getConceptId(),
                                                IS_A_LABEL);
                                            productSummary.addEdge(
                                                mppNode.join().getConceptId(),
                                                mp.getConcept().getConceptId(),
                                                CONTAINS_LABEL);
                                            productSummary.addEdge(
                                                tppNode.join().getConceptId(),
                                                mp.getConcept().getConceptId(),
                                                CONTAINS_LABEL);
                                            productSummary.addEdge(
                                                ctppNode.join().getConceptId(),
                                                mp.getConcept().getConceptId(),
                                                CONTAINS_LABEL);
                                          });
                                      return mps;
                                    });
                        futures.add(mpsForTpuu);
                      });
                  return c;
                });
    tpuusForCtpp.join();
    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
    return CompletableFuture.completedFuture(productSummary);
  }
}
