package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

public interface ProductCalculationService<T extends ProductDetails> {
  /**
   * Calculates the existing and new products required to create a product based on the product
   * details.
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @return ProductSummary representing the existing and new concepts required to create this
   *     product
   */
  ProductSummary calculateProductFromAtomicData(String branch, PackageDetails<T> packageDetails)
      throws ExecutionException, InterruptedException;

  /**
   * Asynchronously calculates the product from atomic data.
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @return CompletableFuture containing the ProductSummary
   */
  CompletableFuture<ProductSummary> calculateProductFromAtomicDataAsync(
      String branch, PackageDetails<T> packageDetails)
      throws ExecutionException, InterruptedException;
}
