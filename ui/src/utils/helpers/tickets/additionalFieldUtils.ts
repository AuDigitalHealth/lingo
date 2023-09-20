import { AdditionalFieldType, AdditionalFieldTypeValue } from "../../../types/tickets/ticket";

export default function getAdditionalFieldTypeByValue(additionalFieldTypeValue: AdditionalFieldTypeValue, additionalFieldTypes : AdditionalFieldType[]) : AdditionalFieldType | undefined{
    let actualType = undefined;
    
    additionalFieldTypes.forEach(type => {
        const tempVal = type.additionalFieldTypeValues.find(val => {
            if(val.id === additionalFieldTypeValue.id){
                console.log(type);
            }
            return val.id === additionalFieldTypeValue.id;
        })
        if (tempVal !== null && tempVal !== undefined){
            actualType = type;
        }
    })
    return actualType;
}