package com.csiro.tickets.controllers;

import com.csiro.tickets.models.LabelType;
import com.csiro.tickets.repository.LabelRepository;
import com.csiro.tickets.repository.LabelTypeRepository;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LabelController {

  @Autowired LabelRepository labelRepository;

  @Autowired
  LabelTypeRepository labelTypeRepository;

  @GetMapping("/api/tickets/labelType")
  public ResponseEntity<List<LabelType>> getAllLabelTypes(){
    // It's best to just get all the labeltypes - and then map them when we show on the front end to reduce the n of queries
    List<LabelType> labelTypes = labelTypeRepository.findAll();

    return new ResponseEntity<>(labelTypes, HttpStatus.OK);
  }
}
