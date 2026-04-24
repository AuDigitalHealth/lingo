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
package au.gov.digitalhealth.tickets.helper;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import org.springframework.web.multipart.MultipartFile;

public class PathMultipartFile implements MultipartFile {

  private final Path path;
  private final String originalFilename;
  private final String contentType;

  public PathMultipartFile(Path path, String originalFilename, String contentType) {
    this.path = path;
    this.originalFilename = originalFilename;
    this.contentType = contentType;
  }

  @Override
  public String getName() {
    return "file";
  }

  @Override
  public String getOriginalFilename() {
    return originalFilename;
  }

  @Override
  public String getContentType() {
    return contentType;
  }

  @Override
  public boolean isEmpty() {
    try {
      return Files.size(path) == 0;
    } catch (IOException e) {
      return true;
    }
  }

  @Override
  public long getSize() {
    try {
      return Files.size(path);
    } catch (IOException e) {
      return 0;
    }
  }

  @Override
  public byte[] getBytes() throws IOException {
    return Files.readAllBytes(path);
  }

  @Override
  public InputStream getInputStream() throws IOException {
    return Files.newInputStream(path);
  }

  @Override
  public void transferTo(File dest) throws IOException {
    Files.copy(path, dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
  }
}
