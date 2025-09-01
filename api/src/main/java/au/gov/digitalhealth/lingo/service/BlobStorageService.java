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
package au.gov.digitalhealth.lingo.service;

// Add these imports
import au.gov.digitalhealth.lingo.auth.helper.AuthHelper;
import au.gov.digitalhealth.lingo.configuration.ExternalReferenceToBlobStorage;
import au.gov.digitalhealth.lingo.configuration.ExternalReferenceToBlobStorage.S3;
import au.gov.digitalhealth.lingo.configuration.ExternalReferenceToBlobStorage.WhitelistEntry;
import au.gov.digitalhealth.lingo.configuration.model.ExternalIdentifierDefinition;
import au.gov.digitalhealth.lingo.configuration.model.ModelConfiguration;
import au.gov.digitalhealth.lingo.configuration.model.NonDefiningPropertyDefinition;
import au.gov.digitalhealth.lingo.configuration.model.enumeration.NonDefiningPropertyDataType;
import au.gov.digitalhealth.lingo.exception.LingoProblem;
import au.gov.digitalhealth.lingo.exception.ResourceNotFoundProblem;
import au.gov.digitalhealth.lingo.product.ProductSummary;
import au.gov.digitalhealth.lingo.product.details.properties.ExternalIdentifier;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningBase;
import au.gov.digitalhealth.lingo.product.details.properties.NonDefiningProperty;
import au.gov.digitalhealth.lingo.product.update.ProductPropertiesUpdateRequest;
import au.gov.digitalhealth.tickets.models.Attachment;
import au.gov.digitalhealth.tickets.repository.AttachmentRepository;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.PosixFilePermission;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.EnumSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.stream.Collectors;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import lombok.extern.java.Log;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Service
@Log
public class BlobStorageService {

  public static final String ATTACHMENT_PROTOCOL = "attachment://";
  private final AuthHelper authHelper;
  private final ExternalReferenceToBlobStorage externalReferenceToBlobStorage;

  // Inject AttachmentRepository
  private final AttachmentRepository attachmentRepository;

  @Value("${snomio.attachments.directory:attachments}")
  private String attachmentsDirectory;

  // Update constructor to include AttachmentRepository
  public BlobStorageService(
      AuthHelper authHelper,
      ExternalReferenceToBlobStorage externalReferenceToBlobStorage,
      AttachmentRepository attachmentRepository) {
    this.authHelper = authHelper;
    this.externalReferenceToBlobStorage = externalReferenceToBlobStorage;
    this.attachmentRepository = attachmentRepository;
  }

  private static URL validateUrl(String value) {
    // Validate that the value is a valid usable URL
    try {
      final URL url = new URI(value).toURL();
      final String protocol = url.getProtocol();
      if (!protocol.equals("http") && !protocol.equals("https")) {
        throw new LingoProblem(
            "invalid-input",
            "Only http and https URLs are supported: " + value,
            HttpStatus.BAD_REQUEST);
      }

      return url;
    } catch (URISyntaxException | MalformedURLException e) {
      throw new LingoProblem("invalid-input", "Invalid URL: " + value, HttpStatus.BAD_REQUEST, e);
    }
  }

  // Update putDataToS3 to handle both temp files and existing files
  private static String putDataToS3(
      S3 s3, String sha256Hash, String mimeType, Path filePath, String extension) {
    try (S3Client s3Client =
        S3Client.builder()
            .region(Region.of(s3.getRegion()))
            .credentialsProvider(
                StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(s3.getAccessKey(), s3.getSecretKey())))
            .build()) {

      final String objectKey = getObjectKey(s3, sha256Hash, extension);

      // Check if the object already exists in the bucket
      if (!fileAlreadyExists(s3, filePath, objectKey, s3Client)) {
        PutObjectRequest putObjectRequest =
            PutObjectRequest.builder()
                .bucket(s3.getBucketName())
                .key(objectKey)
                .contentType(mimeType)
                .contentLength(Files.size(filePath))
                .build();

        s3Client.putObject(putObjectRequest, RequestBody.fromFile(filePath));
      }

      return s3.getHttpBaseUrl() + "/" + objectKey;

    } catch (Exception e) {
      throw new LingoProblem("Failed to upload file to S3", e);
    } finally {
      // Only delete temp files (those in system temp directory)
      if (filePath.toString().contains(System.getProperty("java.io.tmpdir"))) {
        try {
          Files.deleteIfExists(filePath);
        } catch (IOException e) {
          log.log(Level.SEVERE, "Unable to delete temporary file after S3 copy: " + filePath, e);
        }
      }
    }
  }

  private static boolean fileAlreadyExists(
      S3 s3, Path tempFile, String objectKey, S3Client s3Client) throws IOException {
    long fileSize = Files.size(tempFile);
    try {
      HeadObjectRequest headObjectRequest =
          HeadObjectRequest.builder().bucket(s3.getBucketName()).key(objectKey).build();
      HeadObjectResponse headObjectResponse = s3Client.headObject(headObjectRequest);
      // Object exists and size matches, skip upload
      return headObjectResponse.contentLength() == fileSize;
    } catch (S3Exception e) {
      if (e.statusCode() != 404) {
        throw new LingoProblem("Failed to check object existence in S3", e);
      }
      return false;
    }
  }

  private static String getObjectKey(S3 s3, String sha256Hash, String extension) {
    String filename = sha256Hash + extension;
    return (s3.getPrefix() != null && !s3.getPrefix().isEmpty())
        ? s3.getPrefix() + "/" + filename
        : filename;
  }

  private static Path getTempFile() {
    try {
      // Create temp file with secure permissions
      Path tempFile = Files.createTempFile("blob-storage-", ".tmp");

      // Set restrictive permissions (owner read/write only)
      try {
        Set<PosixFilePermission> permissions =
            EnumSet.of(PosixFilePermission.OWNER_READ, PosixFilePermission.OWNER_WRITE);
        Files.setPosixFilePermissions(tempFile, permissions);
      } catch (UnsupportedOperationException e) {
        // On Windows, POSIX permissions are not supported
        // Try to set file as readable/writable by owner only
        File file = tempFile.toFile();
        boolean readableSuccess = file.setReadable(false, false) && file.setReadable(true, true);
        boolean writableSuccess = file.setWritable(false, false) && file.setWritable(true, true);
        boolean executableSuccess = file.setExecutable(false, false);

        if (!readableSuccess || !writableSuccess || !executableSuccess) {
          log.warning("Could not set restrictive file permissions on Windows for: " + tempFile);
        }
      }

      return tempFile;
    } catch (IOException e) {
      throw new LingoProblem("Failed creating secure temporary file for S3 operations", e);
    }
  }

  private static String calculateSha256(Path tempFile) {
    // Calculate the SHA256 hash of the file
    String sha256Hash;
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      try (InputStream fis = Files.newInputStream(tempFile)) {
        byte[] buffer = new byte[8192];
        int bytesRead;
        while ((bytesRead = fis.read(buffer)) != -1) {
          digest.update(buffer, 0, bytesRead);
        }
      }
      byte[] hashBytes = digest.digest();
      sha256Hash = bytesToHex(hashBytes);
    } catch (NoSuchAlgorithmException | IOException e) {
      try {
        Files.deleteIfExists(tempFile);
      } catch (IOException ex) {
        log.log(
            Level.SEVERE, "Unable to delete temporary file from SHA256 creation: " + tempFile, ex);
      }
      throw new LingoProblem("Unable to calculate SHA256 for file " + tempFile, e);
    }
    return sha256Hash;
  }

  private static String bytesToHex(byte[] bytes) {
    StringBuilder result = new StringBuilder();
    for (byte b : bytes) {
      result.append(String.format("%02x", b));
    }
    return result.toString();
  }

  private static String extractFileExtension(URL url) {
    String path = url.getPath();
    if (path != null && path.contains(".")) {
      int lastDotIndex = path.lastIndexOf('.');
      int lastSlashIndex = path.lastIndexOf('/');
      // Make sure the dot is after the last slash (not in a directory name)
      if (lastDotIndex > lastSlashIndex) {
        return path.substring(lastDotIndex);
      }
    }
    return "";
  }

  // Helper method to extract file extension from filename
  private static String extractFileExtensionFromFilename(String filename) {
    if (filename != null && filename.contains(".")) {
      int lastDotIndex = filename.lastIndexOf('.');
      return filename.substring(lastDotIndex);
    }
    return "";
  }

  private String getData(URL value, Path tempFile) {
    String mimeType = "application/octet-stream"; // Default mime type

    boolean passOnAuthHeader =
        externalReferenceToBlobStorage.getWhitelistPrefixes().stream()
            .filter(prefix -> prefix.matches(value.toString()))
            .anyMatch(WhitelistEntry::isPassOnAuthHeader);

    try {
      HttpURLConnection connection = (HttpURLConnection) value.openConnection();
      // Configure SSL for HTTPS connections in development
      if (connection instanceof HttpsURLConnection httpsURLConnection
          && externalReferenceToBlobStorage.isIgnoreCertificateErrors()) {
        configureSSLForDevelopment(httpsURLConnection);
      }

      connection.setRequestMethod("GET");
      connection.setConnectTimeout(30000);
      connection.setReadTimeout(60000);

      if (passOnAuthHeader) {
        connection.setRequestProperty(
            "Cookie", authHelper.getImsCookieName() + "=" + authHelper.getCookieValue());
      }

      try (InputStream inputStream = connection.getInputStream()) {
        Files.copy(inputStream, tempFile, StandardCopyOption.REPLACE_EXISTING);

        // Get mime type from response headers
        String contentType = connection.getContentType();
        if (contentType != null && !contentType.isEmpty()) {
          mimeType = contentType.split(";")[0].trim(); // Remove charset if present
        }
      }
    } catch (IOException e) {
      try {
        Files.deleteIfExists(tempFile);
      } catch (IOException ex) {
        log.log(Level.SEVERE, "Unable to delete temporary file after failed GET: " + tempFile, ex);
      }
      throw new LingoProblem("Failed to download content from URL: " + value, e);
    }
    return mimeType;
  }

  private void configureSSLForDevelopment(HttpsURLConnection httpsConnection) {
    try {
      // Create trust manager that accepts all certificates (development only)
      TrustManager[] trustAllCerts =
          new TrustManager[] {
            new X509TrustManager() {
              public X509Certificate[] getAcceptedIssuers() {
                return null;
              }

              public void checkClientTrusted(X509Certificate[] certs, String authType) {}

              public void checkServerTrusted(X509Certificate[] certs, String authType) {}
            }
          };

      SSLContext sc = SSLContext.getInstance("SSL");
      sc.init(null, trustAllCerts, new java.security.SecureRandom());

      httpsConnection.setSSLSocketFactory(sc.getSocketFactory());
      httpsConnection.setHostnameVerifier((hostname, session) -> true);

      log.warning(
          "SSL certificate validation disabled for development request to: "
              + httpsConnection.getURL());

    } catch (Exception e) {
      log.log(Level.WARNING, "Could not configure SSL for development", e);
    }
  }

  // Add method to handle attachment:// references
  private String copyAttachmentToBlobStorage(String attachmentReference) {
    try {
      // Extract attachment ID from attachment://123 format
      String attachmentIdStr = attachmentReference.substring(ATTACHMENT_PROTOCOL.length());
      Long attachmentId = Long.parseLong(attachmentIdStr);

      // Get attachment from database
      Optional<Attachment> attachmentOpt = attachmentRepository.findById(attachmentId);
      if (attachmentOpt.isEmpty()) {
        throw new ResourceNotFoundProblem("Attachment not found: " + attachmentId);
      }

      Attachment attachment = attachmentOpt.get();

      Path attachmentPath =
          Path.of(
              attachmentsDirectory
                  + (attachmentsDirectory.endsWith("/") ? "" : "/")
                  + attachment.getLocation());

      if (!Files.exists(attachmentPath)) {
        throw new ResourceNotFoundProblem("Attachment file not found: " + attachmentPath);
      }

      // Determine MIME type
      String mimeType = attachment.getAttachmentType().getMimeType();
      if (mimeType == null || mimeType.isEmpty()) {
        mimeType = "application/octet-stream";
      }

      // Extract file extension from original filename
      String extension = extractFileExtensionFromFilename(attachment.getFilename());

      // Use existing SHA256 if available, otherwise calculate it
      String sha256Hash = attachment.getSha256();

      // Upload to S3 using existing method
      S3 s3 = externalReferenceToBlobStorage.getS3();
      return putDataToS3(s3, sha256Hash, mimeType, attachmentPath, extension);

    } catch (NumberFormatException e) {
      throw new ResourceNotFoundProblem(
          "Invalid attachment reference format: " + attachmentReference);
    }
  }

  // Update the main copyToBlobStorage method to handle attachment references
  private String copyToBlobStorage(String value) {
    // Handle internal attachment references
    if (value.startsWith(ATTACHMENT_PROTOCOL)) {
      return copyAttachmentToBlobStorage(value);
    }

    // Handle external URLs as before
    S3 s3 = externalReferenceToBlobStorage.getS3();
    URL urlToCopy = validateUrl(value);
    final Path tempFile = getTempFile();
    final String mimeType = getData(urlToCopy, tempFile);
    final String sha256Hash = calculateSha256(tempFile);
    return putDataToS3(s3, sha256Hash, mimeType, tempFile, extractFileExtension(urlToCopy));
  }

  public void updateNonDefiningUrlProperties(
      ModelConfiguration modelConfiguration, ProductPropertiesUpdateRequest productSummary) {
    Map<String, NonDefiningPropertyDefinition> nonDefiningPropertyDefinitionMap =
        modelConfiguration.getNonDefiningProperties().stream()
            .filter(p -> NonDefiningPropertyDataType.URI.equals(p.getDataType()))
            .collect(Collectors.toMap(NonDefiningPropertyDefinition::getName, Function.identity()));
    Map<String, ExternalIdentifierDefinition> externalIdentifierDefinitionMap =
        modelConfiguration.getMappings().stream()
            .collect(Collectors.toMap(ExternalIdentifierDefinition::getName, Function.identity()));

    if (productSummary.getNewNonDefiningProperties() != null) {
      for (NonDefiningBase property : productSummary.getNewNonDefiningProperties()) {
        handlePropertyUpdate(
            property, nonDefiningPropertyDefinitionMap, externalIdentifierDefinitionMap);
      }
    }
  }

  public void updateNonDefiningUrlProperties(
      ModelConfiguration modelConfiguration, ProductSummary productSummary) {
    Map<String, NonDefiningPropertyDefinition> nonDefiningPropertyDefinitionMap =
        modelConfiguration.getNonDefiningProperties().stream()
            .filter(p -> NonDefiningPropertyDataType.URI.equals(p.getDataType()))
            .collect(Collectors.toMap(NonDefiningPropertyDefinition::getName, Function.identity()));
    Map<String, ExternalIdentifierDefinition> externalIdentifierDefinitionMap =
        modelConfiguration.getMappings().stream()
            .filter(p -> NonDefiningPropertyDataType.URI.equals(p.getDataType()))
            .collect(Collectors.toMap(ExternalIdentifierDefinition::getName, Function.identity()));

    if (externalReferenceToBlobStorage != null
        && externalReferenceToBlobStorage.isConfigured()
        && (!nonDefiningPropertyDefinitionMap.isEmpty()
            || !externalIdentifierDefinitionMap.isEmpty())) {

      productSummary
          .getNodes()
          .forEach(
              node ->
                  node.getNonDefiningProperties()
                      .forEach(
                          property ->
                              handlePropertyUpdate(
                                  property,
                                  nonDefiningPropertyDefinitionMap,
                                  externalIdentifierDefinitionMap)));
    }
  }

  private void handlePropertyUpdate(
      NonDefiningBase p,
      Map<String, NonDefiningPropertyDefinition> nonDefiningPropertyDefinitionMap,
      Map<String, ExternalIdentifierDefinition> externalIdentifierDefinitionMap) {
    if (nonDefiningPropertyDefinitionMap.containsKey(p.getIdentifierScheme())) {
      NonDefiningProperty nonDefiningProperty = (NonDefiningProperty) p;
      String value = nonDefiningProperty.getValue();
      if (value.startsWith(ATTACHMENT_PROTOCOL)
          || externalReferenceToBlobStorage.getWhitelistPrefixes().stream()
              .anyMatch(prefix -> prefix.matches(value))) {
        nonDefiningProperty.setValue(copyToBlobStorage(value));
      }
    } else if (externalIdentifierDefinitionMap.containsKey(p.getIdentifierScheme())) {
      ExternalIdentifier externalIdentifier = (ExternalIdentifier) p;
      String value = externalIdentifier.getValue();
      if (value.startsWith(ATTACHMENT_PROTOCOL)
          || externalReferenceToBlobStorage.getWhitelistPrefixes().stream()
              .anyMatch(prefix -> prefix.matches(value))) {
        externalIdentifier.setValue(copyToBlobStorage(value));
      }
    }
  }
}
