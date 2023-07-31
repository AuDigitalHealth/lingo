package com.csiro.snomio.models;

import java.util.List;
import java.util.Map;

public class ImsUser {

  private String login;

  private String firstName;

  private String lastName;

  private String email;

  private String langKey;

  private List<String> roles;

  public ImsUser() {

  }

  public ImsUser(Map<String, Object> user) {
    this.login = (String) user.get("login");
    this.firstName = (String) user.get("firstName");
    this.lastName = (String) user.get("lastName");
    this.email = (String) user.get("email");
    this.langKey = (String) user.get("langKey");
    this.roles = (List<String>) user.get("roles");

  }

  public String getLogin() {
    return login;
  }

  public void setLogin(String login) {
    this.login = login;
  }

  public void setFirstName(String firstName) {
    this.firstName = firstName;
  }

  public void setLastName(String lastName) {
    this.lastName = lastName;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public void setLangKey(String langKey) {
    this.langKey = langKey;
  }

  public void setRoles(List<String> roles) {
    this.roles = roles;
  }

  public String getFirstName() {
    return firstName;
  }

  public String getLastName() {
    return lastName;
  }

  public String getEmail() {
    return email;
  }

  public String getLangKey() {
    return langKey;
  }

  public List<String> getRoles() {
    return roles;
  }
}
