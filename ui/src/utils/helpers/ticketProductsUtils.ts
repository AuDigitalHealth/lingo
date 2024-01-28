import { MedicationPackageDetails } from '../../types/product.ts';
import {
  TicketProductGroupOption,
  Ticket,
  TicketProductDto,
  TicketProductGroupOptionType,
} from '../../types/tickets/ticket.ts';
import { ProductTableRow } from '../../types/TicketProduct.ts';

export function mapToTicketProductDto(
  packageDetails: MedicationPackageDetails,
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

export function mapToProductOptions(
  productNames: string[],
  currentProductName: string,
) {
  const insertNewProduct = !productNames.includes(currentProductName);
  const options = productNames.map(function (name: string) {
    const productGroup: TicketProductGroupOption = {
      name: name,
      group: TicketProductGroupOptionType.Existing,
    };
    return productGroup;
  });
  if (insertNewProduct) {
    const newValue: TicketProductGroupOption = {
      name: currentProductName,
      group: TicketProductGroupOptionType.New,
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
    suggestedName += `-${packageDetails.containedProducts[0].value}`;
  }
  return suggestedName;
}
