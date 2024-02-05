export interface SearchConditionBody {
  orderCondition?: OrderCondition;
  searchConditions: SearchCondition[];
}

export interface SearchCondition {
  key: string;
  operation: string;
  value?: string;
  valueIn?: string[];
  condition: string;
}

export interface OrderCondition {
  fieldName: string;
  order: 0 | 1 | -1;
}
