package com.csiro.tickets.repository;

import com.csiro.tickets.models.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

}
