import { State } from "../../types/tickets/ticket";

export function mapToStateOptions(states: State[]){
    const stateList = states.map((state) => {
        return {value: state.label, label: state.label};
    })
    return stateList;
}