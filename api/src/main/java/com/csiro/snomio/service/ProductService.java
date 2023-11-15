package com.csiro.snomio.service;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import com.csiro.snomio.exception.ProductModelProblem;
import com.csiro.snomio.exception.SingleConceptExpectedProblem;
import com.csiro.snomio.models.product.Node;
import com.csiro.snomio.models.product.ProductSummary;
import java.util.Collection;
import java.util.Objects;
import lombok.extern.java.Log;
import org.jgrapht.alg.TransitiveReduction;
import org.jgrapht.graph.DefaultEdge;
import org.jgrapht.graph.DirectedAcyclicGraph;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/** Service for product-centric operations */
@Service
@Log
public class ProductService {

  public static final String TPP_FOR_CTPP_ECL = ">> <id> and ^ 929360041000036105";
  public static final String MPP_FOR_CTPP_ECL =
      "(>> <id> and ^ 929360081000036101) minus >(>> <id> and ^ 929360081000036101)";
  public static final String TP_FOR_PRODUCT_ECL = ">> <id>.774158006";
  public static final String TPUU_FOR_CTPP_ECL =
      "(>> ((<id>.774160008) or (<id>.999000081000168101))) and (^ 929360031000036100)";
  public static final String MPUU_FOR_MPP_ECL =
      "(>> ((<id>.774160008) or (<id>.999000081000168101)) and ^ 929360071000036103) minus >(>> ((<id>.774160008) or (<id>.999000081000168101)) and ^ 929360071000036103)";
  public static final String MPUU_FOR_TPUU_ECL =
      "(>> <id> and ^ 929360071000036103) minus >(>> <id> and ^ 929360071000036103)";
  public static final String MP_FOR_TPUU_ECL =
      "(>> <id> and ^ 929360061000036106) minus >(>> <id> and ^ 929360061000036106)";
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

  @Autowired
  ProductService(SnowstormClient snowStormApiClient) {
    this.snowStormApiClient = snowStormApiClient;
  }

  public ProductSummary getProductSummary(String branch, String productId) {
    log.info("Getting product model for " + productId + " on branch " + branch);
    // TODO validate productId is a CTPP
    // TODO handle error responses from Snowstorm

    ProductSummary productSummary = new ProductSummary();
    log.fine("Adding concepts and relationships for " + productId);
    addConceptsAndRelationshipsForProduct(branch, productId, productSummary);
    log.fine("Adding subpacks for " + productId);
    snowStormApiClient
        .getConceptsFromEcl(branch, SUBPACK_FROM_PARENT_PACK_ECL, productId, 0, 100)
        .stream()
        .map(SnowstormConceptMini::getConceptId)
        .forEach(
            id -> {
              addConceptsAndRelationshipsForProduct(branch, id, productSummary);
              productSummary.addEdge(productId, id, CONTAINS_LABEL);
            });

    log.fine("Calculating transitive reduction for product model for " + productId);
    DirectedAcyclicGraph<String, DefaultEdge> graph = new DirectedAcyclicGraph<>(DefaultEdge.class);
    productSummary.getNodes().forEach(node -> graph.addVertex(node.getConcept().getConceptId()));
    for (Node node : productSummary.getNodes()) {
      snowStormApiClient
          .getDescendants(
              branch,
              Long.parseLong(Objects.requireNonNull(node.getConcept().getConceptId())),
              0,
              300)
          .stream()
          .map(SnowstormConceptMini::getConceptId)
          .filter(graph::containsVertex)
          .forEach(id -> graph.addEdge(id, node.getConcept().getConceptId()));
    }
    TransitiveReduction.INSTANCE.reduce(graph);

    graph
        .edgeSet()
        .forEach(
            edge ->
                productSummary.addEdge(
                    graph.getEdgeSource(edge), graph.getEdgeTarget(edge), "is a"));

    log.info("Done product model for " + productId + " on branch " + branch);
    return productSummary;
  }

  private void addConceptsAndRelationshipsForProduct(
      String branch, String productId, ProductSummary productSummary) {
    // add the product concept
    SnowstormConceptMini ctpp = snowStormApiClient.getConcept(branch, productId);
    productSummary.setSubject(ctpp);
    productSummary.addNode(ctpp, CTPP_LABEL);
    // add the TPP for the product
    SnowstormConceptMini tpp =
        addSingleNode(branch, productSummary, productId, TPP_FOR_CTPP_ECL, TPP_LABEL);
    // look up the MPP for the product summary
    Collection<SnowstormConceptMini> mpps =
        snowStormApiClient.getConceptsFromEcl(branch, MPP_FOR_CTPP_ECL, productId, 0, 100);
    for (SnowstormConceptMini mpp : mpps) {
      productSummary.addNode(mpp, MPP_LABEL);
      productSummary.addEdge(tpp.getConceptId(), mpp.getConceptId(), IS_A_LABEL);

      Collection<SnowstormConceptMini> mpuus =
          snowStormApiClient.getConceptsFromEcl(branch, MPUU_FOR_MPP_ECL, productId, 0, 100);
      for (SnowstormConceptMini mpuu : mpuus) {
        productSummary.addNode(mpuu, MPUU_LABEL);
        productSummary.addEdge(mpp.getConceptId(), mpuu.getConceptId(), CONTAINS_LABEL);
      }
    }

    // look up the TP
    SnowstormConceptMini tp =
        addSingleNode(branch, productSummary, productId, TP_FOR_PRODUCT_ECL, TP_LABEL);
    productSummary.addEdge(tpp.getConceptId(), tp.getConceptId(), HAS_PRODUCT_NAME_LABEL);

    // look up TPUUs for the product
    Collection<SnowstormConceptMini> tpuus =
        snowStormApiClient.getConceptsFromEcl(branch, TPUU_FOR_CTPP_ECL, productId, 0, 100);
    for (SnowstormConceptMini tpuu : tpuus) {
      productSummary.addNode(tpuu, TPUU_LABEL);
      productSummary.addEdge(ctpp.getConceptId(), tpuu.getConceptId(), CONTAINS_LABEL);
      productSummary.addEdge(tpp.getConceptId(), tpuu.getConceptId(), CONTAINS_LABEL);

      SnowstormConceptMini tpuuTp =
          addSingleNode(branch, productSummary, tpuu.getConceptId(), TP_FOR_PRODUCT_ECL, TP_LABEL);
      productSummary.addEdge(tpuu.getConceptId(), tpuuTp.getConceptId(), HAS_PRODUCT_NAME_LABEL);

      snowStormApiClient
          .getConceptsFromEcl(branch, MPUU_FOR_TPUU_ECL, tpuu.getConceptId(), 0, 100)
          .forEach(mpuu -> productSummary.addNode(mpuu, MPUU_LABEL));

      snowStormApiClient
          .getConceptsFromEcl(branch, MP_FOR_TPUU_ECL, tpuu.getConceptId(), 0, 100)
          .forEach(mp -> productSummary.addNode(mp, MP_LABEL));
    }
  }

  private SnowstormConceptMini addSingleNode(
      String branch, ProductSummary productSummary, String productId, String ecl, String type) {
    long id = Long.parseLong(productId);
    try {
      SnowstormConceptMini conceptSummary = snowStormApiClient.getConceptFromEcl(branch, ecl, id);
      productSummary.addNode(conceptSummary, type);
      return conceptSummary;
    } catch (SingleConceptExpectedProblem e) {
      throw new ProductModelProblem(type, id, e);
    }
  }
}
