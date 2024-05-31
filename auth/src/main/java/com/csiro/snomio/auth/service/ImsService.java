package com.csiro.snomio.auth.service;

import com.google.gson.JsonObject;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.http.Cookie;
import io.restassured.http.Cookies;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
public class ImsService {

  @Value("${ihtsdo.ims.api.cookie.name}")
  String imsCookieName;

  @Value("${ims-username}")
  String username;

  @Value("${ims-password}")
  String password;

  @Value("${ihtsdo.ims.api.url}")
  String imsUrl;

  @Cacheable("authCookie")
  public Cookie getDefaultCookie() {
    final JsonObject usernameAndPassword = new JsonObject();

    usernameAndPassword.addProperty("login", username);
    usernameAndPassword.addProperty("password", password);

    final Cookies cookies =
        RestAssured.given()
            .contentType(ContentType.JSON)
            .when()
            .body(usernameAndPassword.toString())
            .post(imsUrl + "/api/authenticate")
            .then()
            .statusCode(200)
            .extract()
            .response()
            .getDetailedCookies();

    return cookies.get(imsCookieName);
  }
}
