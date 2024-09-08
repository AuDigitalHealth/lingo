package com.csiro.eclrefset;

import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import lombok.extern.java.Log;

@Log
public class FileAppender {
  private String filePath;

  public FileAppender(String filePath) {
    this.filePath = filePath;
  }

  public void appendToFile(String content) {
    // Try-with-resources block to automatically close the BufferedWriter
    try (BufferedWriter writer = new BufferedWriter(new FileWriter(filePath, true))) {
      writer.write(content);
      writer.newLine();
    } catch (IOException e) {
      log.severe("Error writing to file: " + e.getMessage());
    }
  }
}
