package com.csiro.snomio.util;

import static com.csiro.snomio.service.ProductService.MPP_LABEL;
import static com.csiro.snomio.service.ProductService.MPUU_LABEL;
import static com.csiro.snomio.service.ProductService.TPP_LABEL;

import com.csiro.snomio.models.product.Ingredient;
import com.csiro.snomio.models.product.MedicationProductDetails;
import com.csiro.snomio.models.product.PackageDetails;
import com.csiro.snomio.models.product.PackageQuantity;
import com.csiro.snomio.models.product.ProductQuantity;
import com.csiro.snomio.models.product.ProductSummary;
import java.util.Map;
import java.util.stream.Collectors;

public class EclBuilder {

  private EclBuilder() {}

  public static String getMedicinalUnitEcl(
      MedicationProductDetails productDetails, boolean branded) {
    StringBuilder ecl = new StringBuilder();
    if (branded) {
      ecl.append("^ 929360031000036100:");
    } else {
      ecl.append("^ 929360071000036103:");
    }

    boolean appended = false;

    if (branded && productDetails.getProductName() != null) {
      if (appended) {
        ecl.append(", ");
      }
      ecl.append(" 774158006 = ");
      ecl.append(productDetails.getProductName().getConceptId());
      appended = true;
    }

    // TODO - Snowstorm isn't handling these string type datatype properties at present
    //    if (branded && productDetails.getOtherIdentifyingInformation() != null) {
    //      if (appended) {
    //        ecl.append(", ");
    //      }
    //      ecl.append(" 999000001000168109 = \"");
    //      ecl.append(productDetails.getOtherIdentifyingInformation());
    //      ecl.append("\"");
    //      appended = true;
    //    }

    if (branded) {
      if (appended) {
        ecl.append(", ");
      }
      ecl.append(" 1142140007 = #");
      ecl.append(productDetails.getActiveIngredients().size());
      appended = true;
    }

    if (productDetails.getContainerType() != null) {
      if (appended) {
        ecl.append(", ");
      }
      ecl.append(" 30465011000036106 = ");
      ecl.append(productDetails.getContainerType().getConceptId());
      appended = true;
    }

    if (productDetails.getDeviceType() != null) {
      if (appended) {
        ecl.append(", ");
      }
      ecl.append(" 999000061000168105 = ");
      ecl.append(productDetails.getDeviceType().getConceptId());
      appended = true;
    }

    String formId =
        productDetails.getGenericForm() == null
            ? null
            : productDetails.getGenericForm().getConceptId();
    formId =
        branded && productDetails.getSpecificForm() != null
            ? productDetails.getSpecificForm().getConceptId()
            : formId;
    if (formId != null) {
      if (appended) {
        ecl.append(", ");
      }
      ecl.append(" 411116001 = ");
      ecl.append(formId);
      appended = true;
    }

    if (productDetails.getQuantity() != null) {
      if (appended) {
        ecl.append(", ");
      }
      ecl.append("{ 774163005 = ");
      ecl.append(productDetails.getQuantity().getUnit().getConceptId());
      ecl.append(", ");
      ecl.append(" 1142142004 = #");
      ecl.append(productDetails.getQuantity().getValue());
      ecl.append("}");
      appended = true;
    }

    StringBuilder ingredientExpression = getIngredientExpression(productDetails);

    if (!ingredientExpression.isEmpty()) {
      if (appended) {
        ecl.append(", ");
      }
      ecl.append(ingredientExpression);
      appended = true;
    }

    if (productDetails.getActiveIngredients() != null) {
      if (appended) {
        ecl.append(", ");
      }
      ecl.append("[0..0] 127489000 != (");
      String ingredients =
          productDetails.getActiveIngredients().stream()
              .map(i -> i.getActiveIngredient().getConceptId())
              .collect(Collectors.joining(" OR "));
      if (ingredients.isEmpty()) {
        ecl.append("*)");
      } else {
        ecl.append(ingredients);
        ecl.append(")");
      }

      if (productDetails.getActiveIngredients().stream()
          .anyMatch(i -> i.getPreciseIngredient() != null)) {
        ecl.append(", ");
        ecl.append("[0..0] 762949000 != (");
        String preciseIngredients =
            productDetails.getActiveIngredients().stream()
                .filter(i -> i.getPreciseIngredient() != null)
                .map(i -> i.getPreciseIngredient().getConceptId())
                .collect(Collectors.joining(" OR "));
        if (preciseIngredients.isEmpty()) {
          ecl.append("*)");
        } else {
          ecl.append(preciseIngredients);
          ecl.append(")");
        }
      }
    }

    return ecl.toString();
  }

  private static StringBuilder getIngredientExpression(MedicationProductDetails productDetails) {
    StringBuilder ingredientExpression = new StringBuilder();
    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      boolean appendedIngredient = false;
      ingredientExpression.append("{");
      if (ingredient.getActiveIngredient() != null
          && (ingredient.getPreciseIngredient() == null
              || ingredient.getActiveIngredient().equals(ingredient.getPreciseIngredient()))) {
        ingredientExpression.append(" 127489000 = ");
        ingredientExpression.append(ingredient.getActiveIngredient().getConceptId());
        appendedIngredient = true;
      }

      if (ingredient.getPreciseIngredient() != null
          && (ingredient.getActiveIngredient() == null
              || !ingredient.getPreciseIngredient().equals(ingredient.getActiveIngredient()))) {
        if (appendedIngredient) {
          ingredientExpression.append(", ");
        }
        ingredientExpression.append(" 762949000 = ");
        ingredientExpression.append(ingredient.getPreciseIngredient().getConceptId());
        appendedIngredient = true;
      }

      if (ingredient.getBasisOfStrengthSubstance() != null) {
        if (appendedIngredient) {
          ingredientExpression.append(", ");
        }
        ingredientExpression.append(" 732943007 = ");
        ingredientExpression.append(ingredient.getBasisOfStrengthSubstance().getConceptId());
        appendedIngredient = true;
      }

      if (ingredient.getConcentrationStrength() != null) {
        if (appendedIngredient) {
          ingredientExpression.append(", ");
        }
        ingredientExpression.append("999000031000168102 = ");
        ingredientExpression.append(ingredient.getConcentrationStrength().getUnit().getConceptId());
        ingredientExpression.append(", ");
        ingredientExpression.append(" 999000021000168100 = #");
        ingredientExpression.append(ingredient.getConcentrationStrength().getValue());
        appendedIngredient = true;
      }

      if (ingredient.getTotalQuantity() != null) {
        if (appendedIngredient) {
          ingredientExpression.append(", ");
        }
        ingredientExpression.append("999000051000168108 = ");
        ingredientExpression.append(ingredient.getTotalQuantity().getUnit().getConceptId());
        ingredientExpression.append(", ");
        ingredientExpression.append(" 999000041000168106 = #");
        ingredientExpression.append(ingredient.getTotalQuantity().getValue());
      }

      ingredientExpression.append("}");
    }
    return ingredientExpression;
  }

  public static String getMpEcl(MedicationProductDetails productDetails) {
    // < 763158003 : (127489000 = 372687004 , [0..0] 127489000 != 372687004 )
    StringBuilder ecl = new StringBuilder();

    ecl.append("< 763158003 : (");

    for (Ingredient ingredient : productDetails.getActiveIngredients()) {
      ecl.append("127489000 = ");
      ecl.append(ingredient.getActiveIngredient().getConceptId());
      ecl.append(", ");
    }

    ecl.append("[0..0] 127489000 != (");
    ecl.append(
        productDetails.getActiveIngredients().stream()
            .map(i -> i.getActiveIngredient().getConceptId())
            .collect(Collectors.joining(" OR ")));
    ecl.append("), ");

    ecl.append("[0..0] 411116001 = *, [0..0] 1142140007 = *, [0..0] 1142139005 = *)");
    return ecl.toString();
  }

  public static String getPackagedClinicalDrugEcl(
      PackageDetails<MedicationProductDetails> packageDetails,
      Map<PackageQuantity<MedicationProductDetails>, ProductSummary> innerPackageSummaries,
      Map<ProductQuantity<MedicationProductDetails>, ProductSummary> innnerProductSummaries,
      boolean branded,
      boolean container) {

    if (innerPackageSummaries.entrySet().stream()
        .anyMatch(e -> getPackageReference(e.getValue(), branded, container) == null)) {
      return null;
    }

    if (innnerProductSummaries.entrySet().stream()
        .anyMatch(e -> getProductReference(e.getValue(), branded) == null)) {
      return null;
    }

    StringBuilder ecl = new StringBuilder();

    ecl.append("< 781405001:");

    if (container) {
      ecl.append("30465011000036106 = ");
      ecl.append(packageDetails.getContainerType().getConceptId());
    } else {
      ecl.append("[0..0] 30465011000036106 = *");
    }

    if (branded) {
      ecl.append(", ");
      ecl.append("774158006 = ");
      ecl.append(packageDetails.getProductName().getConceptId());
    }

    String packages =
        innerPackageSummaries.entrySet().stream()
            .map(
                e -> {
                  StringBuilder innerEcl = new StringBuilder();
                  innerEcl.append("{ 774163005 = ");
                  innerEcl.append(e.getKey().getUnit().getConceptId());
                  innerEcl.append(", ");
                  innerEcl.append(" 1142142004 = #");
                  innerEcl.append(e.getKey().getValue());
                  String packageReference = getPackageReference(e.getValue(), branded, container);
                  if (packageReference != null) {
                    innerEcl.append(", ");
                    innerEcl.append(" 774160008 = ");
                    innerEcl.append(packageReference);
                  }
                  innerEcl.append("}");
                  return innerEcl.toString();
                })
            .collect(Collectors.joining(","));

    if (!packages.isEmpty()) {
      ecl.append(", ");
      ecl.append(packages);
      ecl.append(", ");
      ecl.append("999000091000168103 = #");
      ecl.append(innerPackageSummaries.size());
    }

    String products =
        innnerProductSummaries.entrySet().stream()
            .map(
                e -> {
                  StringBuilder innerEcl = new StringBuilder();
                  innerEcl.append("{ 774163005 = ");
                  innerEcl.append(e.getKey().getUnit().getConceptId());
                  innerEcl.append(", ");
                  innerEcl.append(" 1142142004 = #");
                  innerEcl.append(e.getKey().getValue());
                  String productReference = getProductReference(e.getValue(), branded);
                  if (productReference != null) {
                    innerEcl.append(", ");
                    innerEcl.append(" 774160008 = ");
                    innerEcl.append(productReference);
                  }
                  innerEcl.append("}");
                  return innerEcl.toString();
                })
            .collect(Collectors.joining(","));

    if (!products.isEmpty()) {
      ecl.append(", ");
      ecl.append(products);
      ecl.append(", ");
      ecl.append("1142143009 = #");
      ecl.append(innnerProductSummaries.size());
    }
    return ecl.toString();
  }

  private static String getProductReference(ProductSummary summary, boolean branded) {
    if (branded) {
      return summary.getSubject().getConceptId();
    } else {
      return summary.getSingleConceptWithLabel(MPUU_LABEL);
    }
  }

  private static String getPackageReference(
      ProductSummary summary, boolean branded, boolean container) {
    if (branded) {
      if (container) {
        return summary.getSubject().getConceptId();
      } else {
        return summary.getSingleConceptWithLabel(TPP_LABEL);
      }
    } else {
      return summary.getSingleConceptWithLabel(MPP_LABEL);
    }
  }
}
