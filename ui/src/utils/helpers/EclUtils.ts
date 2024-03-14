import { FieldBindings, FieldEclGenerated } from '../../types/FieldBindings.ts';
import { UseFormGetValues } from 'react-hook-form';
import {
  DevicePackageDetails,
  MedicationPackageDetails,
} from '../../types/product.ts';

export function appendIdsToEcl(ecl: string, idArray: string[]) {
  const ids = idArray.join(' OR ');
  ecl = encodeURIComponent('(') + ecl + encodeURIComponent(`) AND (${ids})`);
  return ecl;
}
export function generateEclFromBinding(
  bindings: FieldBindings,
  bindingKey: string,
) {
  const ecl = bindings.bindingsMap.get(bindingKey) as string;
  return ecl;
}

export function generateEclForMedication(
  bindings: FieldBindings,
  bindingKey: string,
  index: number,
  productsArray: string,
  getValues: UseFormGetValues<MedicationPackageDetails>,
): FieldEclGenerated {
  const ecl = bindings.bindingsMap.get(bindingKey) as string;
  let generatedEcl = ecl;
  const eclFieldOut: FieldEclGenerated = {
    actualEcl: ecl,
    generatedEcl: generatedEcl,
    relatedFields: [],
  };

  if (ecl.includes('@')) {
    let parent;
    let parentIdent;
    if (generatedEcl.includes('@medicationProduct.genericForm')) {
      parent = getValues(
        `${productsArray}[${index}].productDetails.genericForm` as 'containedProducts.0.productDetails.genericForm',
      );
      generatedEcl = generatedEcl.replace(
        /@medicationProduct.genericForm/gi,
        parent?.conceptId as string,
      );
      parentIdent = 'medicationProduct.genericForm';
    } else if (
      generatedEcl.includes(
        '@medicationProduct.activeIngredients.activeIngredient',
      )
    ) {
      parent = getValues(
        `${productsArray}[${index}].activeIngredient` as 'containedProducts.0.productDetails.activeIngredients.0.activeIngredient',
      );
      generatedEcl = generatedEcl.replace(
        /@medicationProduct.activeIngredients.activeIngredient/gi,
        parent?.conceptId as string,
      );
      parentIdent = '@medicationProduct.activeIngredients.activeIngredient';
    }
    eclFieldOut.relatedFields.push({
      relatedTo: parentIdent,
      relatedValue: parent ? parent : undefined,
    });
    eclFieldOut.generatedEcl = generatedEcl;
  }
  return eclFieldOut;
}
export function generateEclForDevice(
  bindings: FieldBindings,
  bindingKey: string,
  index: number,
  productsArray: string,
  getValues: UseFormGetValues<DevicePackageDetails>,
): FieldEclGenerated {
  const ecl = bindings.bindingsMap.get(bindingKey) as string;
  let generatedEcl = ecl;
  const eclFieldOut: FieldEclGenerated = {
    actualEcl: ecl,
    generatedEcl: generatedEcl,
    relatedFields: [],
  };

  if (ecl.includes('@')) {
    let parent;
    let parentIdent;
    if (generatedEcl.includes('@deviceProduct.deviceType')) {
      parent = getValues(
        `${productsArray}[${index}].productDetails.deviceType` as 'containedProducts.0.productDetails.deviceType',
      );
      generatedEcl = generatedEcl.replace(
        /@deviceProduct.deviceType/gi,
        parent?.conceptId as string,
      );
      parentIdent = 'deviceProduct.deviceType';
    }
    eclFieldOut.relatedFields.push({
      relatedTo: parentIdent,
      relatedValue: parent,
    });
    eclFieldOut.generatedEcl = generatedEcl;
  }
  return eclFieldOut;
}
