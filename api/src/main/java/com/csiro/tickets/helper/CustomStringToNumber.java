package com.csiro.tickets.helper;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class CustomStringToNumber implements Converter<String, Long> {

  @Override
  public Long convert(String source) {
    if (source.equals("null")) {
      return null;
    }

    return Long.valueOf(source);
  }
}
