package com.csiro.snomio.security.auth;

import com.csiro.snomio.models.ImsUser;
import org.springframework.security.core.Authentication;

public interface IAuthHelper {
  Authentication getAuthentication();

  ImsUser getImsUser();

  String getCookie();
}
