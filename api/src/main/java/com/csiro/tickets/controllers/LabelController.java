package com.csiro.tickets.controllers;

import com.csiro.tickets.repository.LabelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LabelController {

  @Autowired
  LabelRepository labelRepository;
}
