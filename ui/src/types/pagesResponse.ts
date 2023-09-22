export interface PagedItem {
  _links: Page;
  _embedded: Embedded;
  page: Page;
}

export interface Page {
  size: string;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface Embedded {
  item?: [];
}

export interface Links {
  first: Link;
  prev?: Link;
  self: Link;
  next?: Link;
  last: Link;
}

export interface Link {
  href: 'string';
}
