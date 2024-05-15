import { Chip, Tooltip } from '@mui/material';
import {
  ExternalRequestor,
  ExternalRequestorBasic,
} from '../../../types/tickets/ticket';
import { ColorCode } from '../../../types/ColorCode.ts';

interface ExternalRequestorChipProps {
  externalRequestor?: ExternalRequestor;
  externalRequestorVal?: ExternalRequestorBasic;
  externalRequestorList: ExternalRequestor[];
}
function ExternalRequestorChip({
  externalRequestorVal,
  externalRequestorList,
  externalRequestor,
}: ExternalRequestorChipProps) {
  const getExternalRequestorInfo = (id: string | undefined): ColorCode => {
    if (id === undefined) ColorCode.Aqua;
    const thisLabelType = externalRequestorList.find(externalRequestorType => {
      return externalRequestorType.id === Number(id);
    });
    return thisLabelType?.displayColor || ColorCode.Aqua;
  };

  if (externalRequestorVal !== undefined) {
    return (
      <Tooltip
        title={externalRequestorVal.externalRequestorName}
        key={externalRequestorVal.externalRequestorId}
      >
        <Chip
          // color={getLabelInfo(labelVal.labelTypeId)}
          label={externalRequestorVal.externalRequestorName}
          size="small"
          sx={{
            color: 'black',
            backgroundColor: getExternalRequestorInfo(
              externalRequestorVal.externalRequestorId,
            ),
          }}
        />
      </Tooltip>
    );
  } else if (externalRequestor !== undefined) {
    return (
      <Tooltip title={externalRequestor.name} key={externalRequestor.id}>
        <Chip
          // color={getLabelInfo(label.id.toString())}
          label={externalRequestor.name}
          size="small"
          sx={{
            color: 'black',
            backgroundColor: getExternalRequestorInfo(
              externalRequestor.id.toString(),
            ),
          }}
        />
      </Tooltip>
    );
  } else {
    return <></>;
  }
}

export default ExternalRequestorChip;
