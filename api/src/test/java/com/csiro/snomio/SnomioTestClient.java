package com.csiro.snomio;

import static io.restassured.RestAssured.given;

import com.csiro.snomio.models.product.ProductCreationDetails;
import com.csiro.snomio.models.product.ProductSummary;
import com.csiro.snomio.models.product.details.DeviceProductDetails;
import com.csiro.snomio.models.product.details.MedicationProductDetails;
import com.csiro.snomio.models.product.details.PackageDetails;
import com.csiro.tickets.models.Ticket;
import io.restassured.common.mapper.TypeRef;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.specification.RequestSpecification;
import jakarta.validation.Valid;
import org.junit.jupiter.api.Assertions;
import org.springframework.http.HttpStatus;

public class SnomioTestClient {

  private final Cookie imsCookie;
  private final String snomioLocation;

  public SnomioTestClient(Cookie imsCookie, String snomioLocation) {
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

  public ProductSummary createProduct(
      ProductCreationDetails<MedicationProductDetails> productCreationDetails) {
    return postRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product",
        productCreationDetails,
        HttpStatus.CREATED,
        ProductSummary.class);
  }

  public ProductSummary calculateProductSummary(
      PackageDetails<MedicationProductDetails> packageDetails) {
    return postRequest(
        "/api/MAIN/SNOMEDCT-AU/AUAMT/medications/product/$calculate",
        packageDetails,
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

  public void getRequest(String path, HttpStatus expectedStatus) {
    withAuth()
        .contentType(ContentType.JSON)
        .when()
        .get(snomioLocation + path)
        .then()
        .log()
        .all()
        .statusCode(expectedStatus.value());
  }
}
