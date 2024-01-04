package com.csiro.tickets.helper;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import javax.imageio.ImageIO;
import org.imgscalr.Scalr;

public class AttachmentUtils {

  public static String getAttachmentAbsolutePath(
      String attachmentsDirectory, String attachmentSha256) {
    String fileLocation = attachmentsDirectory + getAttachmentRelativePath(attachmentSha256);
    return fileLocation;
  }

  public static String getAttachmentRelativePath(String attachmentSha256) {
    String fileLocation = getPrefix(attachmentSha256) + "/" + attachmentSha256;
    return fileLocation;
  }

  public static String getThumbnailAbsolutePath(
      String attachmentsDirectory, String attachmentSha256) {
    String thumbLocation = attachmentsDirectory + getThumbnailRelativePath(attachmentSha256);
    return thumbLocation;
  }

  public static String getThumbnailRelativePath(String attachmentSha256) {
    String thumbLocation = getPrefix(attachmentSha256) + "/_thumb_" + attachmentSha256 + ".png";
    return thumbLocation;
  }

  private static String getPrefix(String attachmentSha256) {
    return attachmentSha256.substring(0, 2) + "/" + attachmentSha256.substring(2, 4);
  }

  /** Copies the file to the destination but does not overwrite the existing one */
  public static void copyAttachmentToDestination(String theFile, String fileLocationToSave)
      throws IOException, NoSuchAlgorithmException {
    File theFileToImport = new File(theFile);
    File newFile = new File(fileLocationToSave);
    if (theFileToImport.exists() && !newFile.exists()) {
      InputStream fileInputStream = new FileInputStream(theFileToImport);
      newFile.getParentFile().mkdirs();
      Files.copy(fileInputStream, newFile.toPath());
      fileInputStream.close();
    }
  }

  /** Caculates the SHA256 hash of a file and returns a lowercase hash */
  public static String calculateSHA256(String filePath)
      throws NoSuchAlgorithmException, IOException {
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] fileBytes = Files.readAllBytes(Path.of(filePath));
    byte[] hashBytes = digest.digest(fileBytes);
    StringBuilder sb = new StringBuilder();
    for (byte b : hashBytes) {
      sb.append(String.format("%02x", b));
    }
    return sb.toString().toLowerCase();
  }

  /**
   * Use org.imgscalr.imgscalr-lib https://github.com/rkalla/imgscalr Library According to tests
   * it's the fastest and deals with all types of images we have in Jira
   */
  public static void saveThumbnail(File imageFile, String thumbFilePath) throws IOException {
    File smallImage = new File(thumbFilePath);
    BufferedImage bufimage = ImageIO.read(imageFile);
    BufferedImage bufISmallImage =
        Scalr.resize(bufimage, Scalr.Method.SPEED, Scalr.Mode.FIT_TO_WIDTH, 200);
    ImageIO.write(bufISmallImage, "png", smallImage);
    bufISmallImage.flush();
  }
}
