package com.csiro.tickets.helper;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.MetadataException;
import com.drew.metadata.exif.ExifIFD0Directory;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigInteger;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import javax.imageio.ImageIO;
import org.imgscalr.Scalr;
import org.springframework.web.multipart.MultipartFile;

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
  public static String calculateSHA256(MultipartFile theFile)
      throws NoSuchAlgorithmException, IOException {
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] hash = digest.digest(theFile.getBytes());
    String sha256 = String.format("%064x", new BigInteger(1, hash));
    return sha256.toLowerCase();
  }

  /**
   * Use org.imgscalr.imgscalr-lib https://github.com/rkalla/imgscalr Library According to tests
   * it's the fastest and deals with all types of images we have in Jira
   */
  public static boolean saveThumbnail(File imageFile, String thumbFilePath)
      throws IOException, ImageProcessingException {
    File smallImage = new File(thumbFilePath);
    BufferedImage bufimage = rotateImageIfRequired(imageFile);
    if (bufimage == null) {
      return false;
    }
    BufferedImage bufISmallImage =
        Scalr.resize(bufimage, Scalr.Method.SPEED, Scalr.Mode.FIT_TO_WIDTH, 200);
    ImageIO.write(bufISmallImage, "png", smallImage);
    bufISmallImage.flush();
    return true;
  }

  /** Rotate the image based on image orientation metadata if it exists */
  private static BufferedImage rotateImageIfRequired(File imageFile)
      throws IOException, ImageProcessingException {
    Metadata metadata = ImageMetadataReader.readMetadata(imageFile);
    BufferedImage img = ImageIO.read(imageFile);
    Directory directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
    if (directory == null) {
      // No metadata in the file return the original image
      return img;
    }
    int orientation = 1;
    try {
      orientation = directory.getInt(ExifIFD0Directory.TAG_ORIENTATION);
    } catch (MetadataException me) {
      // No 'Orientation' metadata tag in the file return the original image
      return img;
    }
    switch (orientation) {
      case 1:
        return img;
      case 6:
        return Scalr.rotate(img, Scalr.Rotation.CW_90, Scalr.OP_ANTIALIAS);
      case 3:
        return Scalr.rotate(img, Scalr.Rotation.CW_180, Scalr.OP_ANTIALIAS);
      case 8:
        return Scalr.rotate(img, Scalr.Rotation.CW_270, Scalr.OP_ANTIALIAS);
      default:
        return img;
    }
  }
}
