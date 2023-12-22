
interface SearchConditionBody {
    orderCondition?: OrderCondition;
    searchConditions: SearchCondition[];
}

interface SearchCondition {
    key: string,
    operation: string,
    value?: string,
    valueIn?: string[],
    condition: string
}

interface OrderCondition {
    fieldName: string;
    order: number;
}