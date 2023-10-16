import { Chip, Tooltip } from '@mui/material';
import { ValidationColor } from '../../../types/validationColor';
import { LabelBasic, LabelType } from '../../../types/tickets/ticket';

interface LabelChipProps {
  label?: LabelType;
  labelVal?: LabelBasic;
  labelTypeList: LabelType[];
}
function LabelChip({ labelVal, labelTypeList, label }: LabelChipProps) {
  const getLabelInfo = (id: string | undefined): ValidationColor => {
    if (id === undefined) ValidationColor.Info;
    const thisLabelType = labelTypeList.find(labelType => {
      return labelType.id === Number(id);
    });
    return thisLabelType?.displayColor || ValidationColor.Info;
  };

  if (labelVal !== undefined) {
    return (
      <Tooltip title={labelVal.labelTypeName} key={labelVal.labelTypeId}>
        <Chip
          color={getLabelInfo(labelVal.labelTypeId)}
          label={labelVal.labelTypeName}
          size="small"
          sx={{ color: 'black' }}
        />
      </Tooltip>
    );
  } else if (label !== undefined) {
    return (
      <Tooltip title={label.name} key={label.id}>
        <Chip
          color={getLabelInfo(label.id.toString())}
          label={label.name}
          size="small"
          sx={{ color: 'black' }}
        />
      </Tooltip>
    );
  } else {
    return <></>;
  }
}

export default LabelChip;
