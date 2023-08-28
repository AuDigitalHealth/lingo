package com.csiro.tickets.service;

import com.csiro.tickets.repository.CommentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class CommentService {

  @Autowired CommentRepository commentRepository;
}
