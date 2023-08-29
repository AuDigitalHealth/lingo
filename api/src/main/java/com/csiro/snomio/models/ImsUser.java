package com.csiro.snomio.models;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ImsUser {

  private String login;

  private String firstName;

  private String lastName;

  private String email;

  private String langKey;

  private List<String> roles;

  public ImsUser(Map<String, Object> user) {
    this.login = (String) user.get("login");
    this.firstName = (String) user.get("firstName");
    this.lastName = (String) user.get("lastName");
    this.email = (String) user.get("email");
    this.langKey = (String) user.get("langKey");
    this.roles = (List<String>) user.get("roles");
  }
}
