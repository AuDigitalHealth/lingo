package au.gov.digitalhealth.lingo.service;

import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.Models;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import java.io.File;
import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.util.ResourceUtils;

@Service
public class SchemaService {
  private final Models models;
  private final ResourceLoader resourceLoader;

  public SchemaService(Models models, ResourceLoader resourceLoader) {
    this.models = models;
    this.resourceLoader = resourceLoader;
  }

  public String getMedicationSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    return readFileContent(modelConfiguration.getBaseMedicationSchema());
  }

  public String getMedicationUiSchema(String branch) {
    ModelConfiguration modelConfiguration = models.getModelConfiguration(branch);
    return readFileContent(modelConfiguration.getBaseMedicationUiSchema());
  }

  private String readFileContent(String filePath) {
    try {
      if (ResourceUtils.isUrl(filePath)) {
        Resource resource = resourceLoader.getResource(filePath);
        return new String(resource.getInputStream().readAllBytes(), Charset.defaultCharset());
      } else {
        File file = new File(filePath);
        return Files.readString(file.toPath());
      }
    } catch (IOException e) {
      throw new LingoProblem("Failed to read schema file from path " + filePath, e);
    }
  }
}
