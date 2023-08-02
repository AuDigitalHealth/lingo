package com.csiro.snomio.security.auth;


import com.csiro.snomio.models.ImsUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class AuthHelper{
    public Authentication getAuthentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }
    public ImsUser getImsUser(){
        return (ImsUser) getAuthentication().getPrincipal();
    }
    public String getCookie(){
        return (String) getAuthentication().getCredentials();
    }
}

