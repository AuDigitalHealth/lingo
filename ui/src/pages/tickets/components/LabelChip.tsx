import { Chip, Tooltip } from '@mui/material';
import { LabelBasic, LabelType } from '../../../types/tickets/ticket';
import { ColorCode } from '../../../types/ColorCode.ts';

interface LabelChipProps {
  label?: LabelType;
  labelVal?: LabelBasic;
  labelTypeList: LabelType[];
}
function LabelChip({ labelVal, labelTypeList, label }: LabelChipProps) {
  const getLabelInfo = (id: string | undefined): ColorCode => {
    if (id === undefined) ColorCode.Aqua;
    const thisLabelType = labelTypeList.find(labelType => {
      return labelType.id === Number(id);
    });
    return thisLabelType?.displayColor || ColorCode.Aqua;
  };

  if (labelVal !== undefined) {
    return (
      <Tooltip title={labelVal.labelTypeName} key={labelVal.labelTypeId}>
        <Chip
          // color={getLabelInfo(labelVal.labelTypeId)}
          label={labelVal.labelTypeName}
          size="small"
          sx={{
            color: 'black',
            backgroundColor: getLabelInfo(labelVal.labelTypeId),
          }}
        />
      </Tooltip>
    );
  } else if (label !== undefined) {
    return (
      <Tooltip title={label.name} key={label.id}>
        <Chip
          // color={getLabelInfo(label.id.toString())}
          label={label.name}
          size="small"
          sx={{
            color: 'black',
            backgroundColor: getLabelInfo(label.id.toString()),
          }}
        />
      </Tooltip>
    );
  } else {
    return <></>;
  }
}

export default LabelChip;
