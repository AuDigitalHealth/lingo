import { Chip, Tooltip } from '@mui/material';
import { ValidationColor } from '../../../types/validationColor';
import { LabelBasic, LabelType } from '../../../types/tickets/ticket';

interface LabelChipProps {
  labelVal: LabelBasic;
  labelTypeList: LabelType[];
}
function LabelChip({ labelVal, labelTypeList }: LabelChipProps) {
  const getLabelInfo = (id: string | undefined): ValidationColor => {
    if (id === undefined) ValidationColor.Info;
    const thisLabelType = labelTypeList.find(labelType => {
      return labelType.id === Number(id);
    });
    return thisLabelType?.displayColor || ValidationColor.Info;
  };

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
}

export default LabelChip;
