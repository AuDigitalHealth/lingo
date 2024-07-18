package com.csiro.tickets.service;

import com.csiro.tickets.repository.CommentRepository;
import org.springframework.stereotype.Component;

@Component
public class CommentService {

  final CommentRepository commentRepository;

  public CommentService(CommentRepository commentRepository) {
    this.commentRepository = commentRepository;
  }
}
