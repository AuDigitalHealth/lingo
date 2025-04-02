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
package au.gov.digitalhealth.lingo;

import static io.restassured.RestAssured.given;

import au.csiro.snowstorm_client.model.SnowstormConceptMini;
import au.gov.digitalhealth.lingo.product.BrandCreationRequest;
import au.gov.digitalhealth.lingo.product.ProductBrands;
import au.gov.digitalhealth.lingo.product.ProductCreationDetails;
import au.gov.digitalhealth.lingo.product.ProductPackSizes;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.bulk.BrandPackSizeCreationDetails;
import au.gov.digitalhealth.lingo.product.bulk.BulkProductAction;
import au.gov.digitalhealth.lingo.product.details.DeviceProductDetails;
import au.gov.digitalhealth.lingo.product.details.MedicationProductDetails;
import au.gov.digitalhealth.lingo.product.details.PackageDetails;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.update.ProductDescriptionUpdateRequest;
import au.gov.digitalhealth.lingo.product.update.ProductExternalIdentifierUpdateRequest;
import au.gov.digitalhealth.tickets.controllers.BulkProductActionDto;
import au.gov.digitalhealth.tickets.models.Ticket;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.restassured.common.mapper.TypeRef;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.response.ExtractableResponse;
import io.restassured.response.Response;
import io.restassured.specification.RequestSpecification;
import jakarta.validation.Valid;
import java.lang.reflect.Type;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;

public class LingoTestClient {

  private final Cookie imsCookie;
  private final String snomioLocation;

  public LingoTestClient(Cookie imsCookie, String snomioLocation) {
    this.imsCookie = imsCookie;
    this.snomioLocation = snomioLocation;
  }

  public RequestSpecification withAuth() {
    return given().cookie(imsCookie);
  }

  public RequestSpecification withBadAuth() {
    return given().cookie("foo");
  }

  public Ticket createTicket(String title) {
    Ticket ticket = Ticket.builder().title(title).description("ticket").build();

    return postRequest("/api/tickets", ticket, HttpStatus.OK, Ticket.class);
  }

  public PackageDetails<MedicationProductDetails> getMedicationPackDetails(long ctppId) {
    return getRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/" + ctppId, HttpStatus.OK, new TypeRef<>() {});
  }

  public ProductPackSizes getMedicationProductPackSizes(long ctppId) {
    return getRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/" + ctppId + "/pack-sizes",
        HttpStatus.OK,
        new TypeRef<>() {});
  }

  public ProductBrands getMedicationProductBrands(long ctppId) {
    return getRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/" + ctppId + "/brands",
        HttpStatus.OK,
        new TypeRef<>() {});
  }

  public MedicationProductDetails getMedicationProductDetails(long tpuuId) {
    return getRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product/" + tpuuId,
        HttpStatus.OK,
        new TypeRef<>() {});
  }

  public PackageDetails<DeviceProductDetails> getDevicePackDetails(long ctppId) {
    return getRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/devices/" + ctppId, HttpStatus.OK, new TypeRef<>() {});
  }

  public DeviceProductDetails getDeviceProductDetails(long ctppId) {
    return getRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/devices/product/" + ctppId, HttpStatus.OK, new TypeRef<>() {});
  }

  public ProductSummary getProductModel(long conceptId) {
    return getRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/product-model/" + conceptId,
        HttpStatus.OK,
        ProductSummary.class);
  }

  public ProductSummary getProductModel(String conceptId) {
    Assertions.assertTrue(Long.parseLong(conceptId) > 0);
    return getProductModel(Long.parseLong(conceptId));
  }

  public ProductSummary createMedicationProduct(
      ProductCreationDetails<MedicationProductDetails> productCreationDetails) {
    return postRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product",
        productCreationDetails,
        HttpStatus.CREATED,
        ProductSummary.class);
  }

  public ProductSummary createNewBrandPackSizes(
      BulkProductAction<BrandPackSizeCreationDetails> action) {
    return postRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product/new-brand-pack-sizes",
        action,
        HttpStatus.CREATED,
        ProductSummary.class);
  }

  public ProductSummary createDeviceProduct(
      ProductCreationDetails<DeviceProductDetails> productCreationDetails) {
    return postRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/devices/product",
        productCreationDetails,
        HttpStatus.CREATED,
        ProductSummary.class);
  }

  public ProductSummary calculateMedicationProductSummary(
      PackageDetails<MedicationProductDetails> packageDetails) {
    return postRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product/$calculate",
        packageDetails,
        HttpStatus.OK,
        ProductSummary.class);
  }

  public SnowstormConceptMini createBrand(BrandCreationRequest brandCreationRequest) {
    return postRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/qualifier/product-name",
        brandCreationRequest,
        HttpStatus.CREATED,
        SnowstormConceptMini.class);
  }

  public SnowstormConceptMini updateProductDescription(
      ProductDescriptionUpdateRequest productDescriptionUpdateRequest, String productId) {
    return putRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/product-model/" + productId + "/descriptions",
        productDescriptionUpdateRequest,
        HttpStatus.OK,
        SnowstormConceptMini.class);
  }

  public Set<ExternalIdentifier> updateProductExternalIdentifiers(
      ProductExternalIdentifierUpdateRequest request, String productId) {
    Type responseType = new ParameterizedTypeReference<Set<ExternalIdentifier>>() {}.getType();
    return putRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/product-model/" + productId + "/external-identifiers",
        request,
        HttpStatus.OK,
        responseType);
  }

  public String calculateMedicationProductSummaryWithBadRequest(
      PackageDetails<MedicationProductDetails> packageDetails) {
    ExtractableResponse<Response> response =
        postRequest(
            "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product/$calculate",
            packageDetails,
            HttpStatus.BAD_REQUEST);
    return response.asString();
  }

  public ProductSummary calculateDeviceProductSummary(
      PackageDetails<DeviceProductDetails> packageDetails) {
    return postRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/devices/product/$calculate",
        packageDetails,
        HttpStatus.OK,
        ProductSummary.class);
  }

  public ProductSummary calculateNewBrandAndPackSizes(
      BrandPackSizeCreationDetails brandPackSizeCreationDetails) {
    return postRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product/$calculateNewBrandPackSizes",
        brandPackSizeCreationDetails,
        HttpStatus.OK,
        ProductSummary.class);
  }

  public <T> @Valid T getRequest(String path, HttpStatus expectedStatus, Class<T> responseType) {
    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(snomioLocation + path)
        .then()
        .log()
        .all()
        .statusCode(expectedStatus.value())
        .extract()
        .as(responseType);
  }

  public <T> @Valid T getRequest(String path, HttpStatus expectedStatus, TypeRef<T> responseType) {
    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(snomioLocation + path)
        .then()
        .log()
        .all()
        .statusCode(expectedStatus.value())
        .extract()
        .as(responseType);
  }

  public <T> @Valid T postRequest(
      String path, Object body, HttpStatus expectedStatus, Class<T> responseType) {
    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(body)
        .post(snomioLocation + path)
        .then()
        .log()
        .all()
        .statusCode(expectedStatus.value())
        .extract()
        .as(responseType);
  }

  public <T> T putRequest(String path, Object body, HttpStatus expectedStatus, Type responseType) {
    String responseBody =
        withAuth()
            .contentType(ContentType.JSON)
            .when()
            .body(body)
            .put(snomioLocation + path)
            .then()
            .log()
            .all()
            .statusCode(expectedStatus.value())
            .extract()
            .asString();

    try {
      ObjectMapper objectMapper = new ObjectMapper();
      return objectMapper.readValue(
          responseBody,
          new TypeReference<T>() {
            @Override
            public Type getType() {
              return responseType;
            }
          });
    } catch (Exception e) {
      throw new RuntimeException("Failed to deserialize response", e);
    }
  }

  public ExtractableResponse<Response> postRequest(
      String path, Object body, HttpStatus expectedStatus) {
    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .body(body)
        .post(snomioLocation + path)
        .then()
        .log()
        .all()
        .statusCode(expectedStatus.value())
        .extract();
  }

  public ExtractableResponse<Response> getRequest(String path, HttpStatus expectedStatus) {
    return withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(snomioLocation + path)
        .then()
        .log()
        .all()
        .statusCode(expectedStatus.value())
        .extract();
  }

  public List<BulkProductActionDto> getBulkProductAction(Long id) {
    return getRequest(
        "/api/tickets/" + id + "/bulk-product-actions", HttpStatus.OK, new TypeRef<>() {});
  }
}
