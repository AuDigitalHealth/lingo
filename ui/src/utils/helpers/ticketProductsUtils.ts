///
/// Copyright 2024 Australian Digital Health Agency ABN 84 425 496 912.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

import {
  DevicePackageDetails,
  MedicationPackageDetails,
  ProductType,
} from '../../types/product.ts';
import {
  AutocompleteGroupOption,
  AutocompleteGroupOptionType,
  Ticket,
  TicketBulkProductActionDto,
  TicketProductDto,
} from '../../types/tickets/ticket.ts';
import { ProductStatus, ProductTableRow } from '../../types/TicketProduct.ts';

export function mapToTicketProductDto(
  packageDetails: MedicationPackageDetails | DevicePackageDetails,
  ticket: Ticket,
  login: string,
  productName: string,
  create: boolean,
) {
  const ticketProductDto: TicketProductDto = {
    ticketId: ticket.id,
    name: productName,
    conceptId: null,
    packageDetails: packageDetails,
    createdBy: create ? login : undefined,
    modifiedBy: login,
    version: null,
  };
  return ticketProductDto;
}
export function filterProductRowById(
  id: number,
  productDetails: ProductTableRow[],
): ProductTableRow | undefined {
  const filteredProduct = productDetails.find(function (product) {
    return product.id === id;
  });
  return filteredProduct;
}
export function findProductType(
  packageDetails: MedicationPackageDetails | DevicePackageDetails,
): ProductType | undefined {
  if (
    packageDetails.containedProducts &&
    packageDetails.containedProducts.length > 0
  ) {
    return packageDetails.containedProducts[0].productDetails?.type;
  }
  return ProductType.medication;
}

export function findProductTypeForBulkAction(
  packageDetails: MedicationPackageDetails | DevicePackageDetails,
): ProductType | undefined {
  if (
    packageDetails.containedProducts &&
    packageDetails.containedProducts.length > 0
  ) {
    return packageDetails.containedProducts[0].productDetails?.type;
  }
  return ProductType.medication;
}

export function mapToProductOptions(
  productNames: string[],
  currentProductName: string,
) {
  const insertNewProduct = !productNames.includes(currentProductName);
  const options = productNames.map(function (name: string) {
    const productGroup: AutocompleteGroupOption = {
      name: name,
      group: AutocompleteGroupOptionType.Existing,
    };
    return productGroup;
  });
  if (insertNewProduct) {
    const newValue: AutocompleteGroupOption = {
      name: currentProductName,
      group: AutocompleteGroupOptionType.New,
    };
    options.unshift(newValue);
  }
  return options;
}
export function filterAndMapToPartialProductNames(
  productDtos: TicketProductDto[] | undefined,
) {
  if (!productDtos) {
    return [];
  }
  //filter the partial products
  const nameArray = productDtos
    .filter(productDto => productDto.conceptId === null)
    .map(function (productDto) {
      return productDto.name;
    });
  return nameArray;
}

export function findProductNameById(
  productDtos: TicketProductDto[] | undefined,
  productId: string,
) {
  if (!productDtos) {
    return undefined;
  }
  //filter the partial products
  const product = productDtos.find(
    product => product.id?.toString() === productId,
  );
  if (product) {
    return product.name;
  }
  return undefined;
}
export function generateSuggestedProductName(
  packageDetails: MedicationPackageDetails,
) {
  let suggestedName = packageDetails.productName
    ? `${packageDetails.productName.pt?.term}`
    : 'New Product';
  if (
    packageDetails.containedProducts.length > 0 &&
    packageDetails.containedProducts[0].value
  ) {
    suggestedName += `-${packageDetails.containedProducts[0].value}`;
  } else if (
    packageDetails.containedPackages.length > 0 &&
    packageDetails.containedPackages[0].value
  ) {
    suggestedName += `-${packageDetails.containedPackages[0].value}`;
  }
  return suggestedName;
}
export function generateSuggestedProductNameForDevice(
  packageDetails: DevicePackageDetails,
) {
  let suggestedName = packageDetails.productName
    ? `${packageDetails.productName.pt?.term}`
    : 'New Product';
  if (
    packageDetails.containedProducts.length > 0 &&
    packageDetails.containedProducts[0].value
  ) {
    suggestedName += `-${packageDetails.containedProducts[0].value}`;
  }
  return suggestedName;
}
export function mapToProductDetailsArray(
  productArray: TicketProductDto[],
  indexStarts: number,
): ProductTableRow[] {
  const productDetailsArray = productArray.map(function (item) {
    const id = indexStarts++;
    const productDto: ProductTableRow = {
      id: id,
      productId: item.id as number,
      idToDelete: id,
      name: item.name,
      conceptId: item.conceptId,
      concept: item.packageDetails.productName
        ? item.packageDetails.productName
        : undefined,
      status:
        item.conceptId && item.conceptId !== null
          ? ProductStatus.Completed
          : ProductStatus.Partial,
      ticketId: item.ticketId,
      version: item.version as number,
      productType: findProductType(item.packageDetails),
      created: item.created as string,
    };
    return productDto;
  });
  return productDetailsArray;
}
export function mapToProductDetailsArrayFromBulkActions(
  bulkProductActions: TicketBulkProductActionDto[],
  indexStarts: number,
): ProductTableRow[] {
  // this may also be a product update, so that must be considered
  const productDetailsArray = bulkProductActions.map(item => {
    item.details.type;
    const id = indexStarts++;
    const productDto: ProductTableRow = {
      id: id,
      bulkProductActionId: item.id as number,
      idToDelete: id,
      name: item.name,
      conceptId: null,
      version: undefined,
      concept: undefined,
      conceptIds: item.conceptIds,

      status: ProductStatus.Completed,
      ticketId: item.ticketId,
      productType: item.details.type,
      created: item.created,
    };
    return productDto;
  });
  return productDetailsArray;
}
