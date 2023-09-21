import { Stack } from "@mui/system";
import { LabelBasic, Ticket } from "../../../../../types/tickets/ticket"
import { Typography } from "@mui/material";
import LabelChip from "../../LabelChip";
import useTicketStore from "../../../../../stores/TicketStore";
import getAdditionalFieldTypeByValue from "../../../../../utils/helpers/tickets/additionalFieldUtils";

interface TicketFieldsProps {
    ticket?: Ticket;
}
export default function TicketFields({ticket} : TicketFieldsProps){
    const { labelTypes, additionalFieldTypes } = useTicketStore();

    const createLabelBasic = (name: string, id: number): LabelBasic => {
        return {
          labelTypeId: id.toString(),
          labelTypeName: name,
        };
      };

    return (
        <>
        <Stack direction="row" width="100%" alignItems="center">
          <Typography variant="caption" fontWeight="bold">
            Labels:
          </Typography>
          {ticket?.labels.map(label => {
            const labelVal = createLabelBasic(label.name, label.id);
            return (
              <div style={{ marginLeft: '1em' }}>
                <LabelChip labelTypeList={labelTypes} labelVal={labelVal} />
              </div>
            );
          })}
        </Stack>
        <Stack
          direction="row"
          width="100%"
          alignItems="center"
          marginTop="0.5em"
        >
          <Typography variant="caption" fontWeight="bold">
            Additional Fields:
          </Typography>
          {ticket?.additionalFieldTypeValues?.map((item, index) => {
            const type = getAdditionalFieldTypeByValue(
              item,
              additionalFieldTypes,
            );
            const length = ticket?.additionalFieldTypeValues?.length || 0;
            const seperator = index !== length - 1 ? ',   ' : ' ';
            return (
              <Typography variant="body1">
                {' ' + type?.name + ': ' + item.valueOf + seperator}
              </Typography>
            );
          })}
        </Stack>
        <Stack
          direction="row"
          width="100%"
          alignItems="center"
          marginTop="0.5em"
        >
          <Typography variant="caption" fontWeight="bold">
            Iteration:
          </Typography>
          <Typography variant="body1">{ticket?.iteration.name}</Typography>
        </Stack>
        <Stack
          direction="row"
          width="100%"
          alignItems="center"
          marginTop="0.5em"
        >
          <Typography variant="caption" fontWeight="bold">
            State:
          </Typography>
          <Typography variant="body1">{ticket?.state.label}</Typography>
        </Stack>
        </>
    )
}