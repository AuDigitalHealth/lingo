package com.poc.mat.controllers;

import com.poc.mat.models.ImsUser;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.WebUtils;


@RestController
@RequestMapping("/api")
public class HomeController {

    @GetMapping("")
    public String index(HttpServletRequest request){
        Cookie cookie = WebUtils.getCookie( request, "dev-ims-ihtsdo");
        String cookieString = cookie.getValue();
        System.out.println("/api");
        return cookieString;
    }

    @GetMapping("/author")
    public String author(HttpServletRequest request, Authentication authentication){
        ImsUser user = (ImsUser) authentication.getPrincipal();
        System.out.println("/author");
        return "u r author";
    }

    @GetMapping("/impossible")
    public String impossible(HttpServletRequest request, Authentication authentication){
        System.out.println("/impossible");
        return "u r impossible";
    }
}
