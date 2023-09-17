package com.csiro.tickets.controllers;

public class ImportEvent {
  private final String message;
  private final double progress;

  public ImportEvent(String message, double progress) {
    this.message = message;
    this.progress = progress;
  }

  public String getMessage() {
    return message;
  }

  public double getProgress() {
    return progress;
  }
}
