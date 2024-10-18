/*
 * Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package au.gov.digitalhealth.eclrefset;

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
