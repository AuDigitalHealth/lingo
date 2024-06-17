import {
  DevicePackageDetails,
  MedicationPackageDetails,
  ProductType,
} from '../../types/product.ts';
import {
  AutocompleteGroupOption,
  AutocompleteGroupOptionType,
  Ticket,
  TicketProductDto,
} from '../../types/tickets/ticket.ts';
import { ProductTableRow } from '../../types/TicketProduct.ts';

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
