package com.csiro.tickets.helper;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import org.springframework.core.io.ClassPathResource;

public class JsonReader {

  public static String readJsonFile(String fileName) {
    try {
      String filePath = new ClassPathResource(fileName).getFile().getAbsolutePath();
      ObjectMapper objectMapper = new ObjectMapper();
      JsonNode jsonNode = objectMapper.readTree(new File(filePath));
      return objectMapper.writeValueAsString(jsonNode);
    } catch (IOException e) {
      e.printStackTrace();
    }
    return null;
  }
}
