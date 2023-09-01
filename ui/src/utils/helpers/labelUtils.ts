import { LabelType, State } from "../../types/tickets/ticket";

export function mapToLabelOptions(labelTypes: LabelType[]){
    const labelList = labelTypes.map((label) => {
        return {value: label.name, label: label.name};
    })
    return labelList;
}