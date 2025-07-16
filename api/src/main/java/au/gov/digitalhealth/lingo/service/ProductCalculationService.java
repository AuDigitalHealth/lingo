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
package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.ModelType;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.ProductDetails;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.util.NmpcType;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import lombok.extern.java.Log;

@Log
public abstract class ProductCalculationService<T extends ProductDetails> {

  /**
   * Calculates the existing and new products required to create a product based on the product
   * details.
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @return ProductSummary representing the existing and new concepts required to create this
   *     product
   */
  public abstract ProductSummary calculateProductFromAtomicData(
      String branch, PackageDetails<T> packageDetails)
      throws ExecutionException, InterruptedException;

  /**
   * Asynchronously calculates the product from atomic data.
   *
   * @param branch branch to lookup concepts in
   * @param packageDetails details of the product to create
   * @return CompletableFuture containing the ProductSummary
   */
  public abstract CompletableFuture<ProductSummary> calculateProductFromAtomicDataAsync(
      String branch, PackageDetails<T> packageDetails)
      throws ExecutionException, InterruptedException;

  protected abstract SnowstormClient getSnowstormClient();

  protected void optionallyAddNmpcType(
      String branch, ModelConfiguration modelConfiguration, PackageDetails<T> packageDetails) {
    if (modelConfiguration.getModelType().equals(ModelType.NMPC)) {
      NonDefiningPropertyDefinition nmpcDefinition =
          modelConfiguration.getNonDefiningPropertiesByName().get("nmpcType");
      if (nmpcDefinition != null && requiredNmpcTypeConceptsExist(branch, nmpcDefinition)) {
        NonDefiningProperty nmpcType = new NonDefiningProperty();
        nmpcType.setIdentifierScheme(nmpcDefinition.getName());
        nmpcType.setIdentifier(nmpcDefinition.getIdentifier());
        nmpcType.setTitle(nmpcDefinition.getTitle());
        nmpcType.setDescription(nmpcDefinition.getDescription());

        nmpcType.setValueObject(packageDetails.getNmpcType().snowstormConceptMini());

        packageDetails
            .getContainedPackages()
            .forEach(
                innerPackage ->
                    innerPackage
                        .getPackageDetails()
                        .getContainedProducts()
                        .forEach(
                            innerProduct ->
                                innerProduct
                                    .getProductDetails()
                                    .getNonDefiningProperties()
                                    .add(nmpcType)));
        packageDetails
            .getContainedProducts()
            .forEach(
                innerProduct ->
                    innerProduct.getProductDetails().getNonDefiningProperties().add(nmpcType));

        packageDetails.getNonDefiningProperties().add(nmpcType);
      } else {
        log.severe("NMPC model type is configured but the required concepts do not exist.");
      }
    }
  }

  private boolean requiredNmpcTypeConceptsExist(
      String branch, NonDefiningPropertyDefinition nmpcDefinition) {
    Set<String> nmpcConcepts =
        new HashSet<>(Collections.singletonList(nmpcDefinition.getIdentifier()));
    nmpcConcepts.addAll(
        Arrays.stream(NmpcType.values()).map(t -> t.getValue()).collect(Collectors.toSet()));
    return getSnowstormClient().conceptIdsThatExist(branch, nmpcConcepts).containsAll(nmpcConcepts);
  }
}
