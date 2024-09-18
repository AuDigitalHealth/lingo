package com.csiro.tickets.repository;

import com.csiro.tickets.models.Comment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
  List<Comment> findByText(String text);

  boolean existsByTicket_IdAndId(Long id, Long id1);

  List<Comment> findByTicket_Id(Long id);
}
