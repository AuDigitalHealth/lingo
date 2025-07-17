import { Typography } from '@mui/material';
import { Box } from '@mui/material';
import { Product7BoxBGColour } from './style/colors';

interface LegendConfig {
  title: string;
  items: LegendConfigItem[];
}

interface LegendConfigItem {
  key: string;
  backgroundColor: string;
  borderColor: string;
  description: string;
}
const LEGEND_CONFIG: LegendConfig = {
  title: 'Legend:',
  items: [
    {
      key: 'new',
      backgroundColor: Product7BoxBGColour.NEW,
      borderColor: Product7BoxBGColour.NEW,
      description: 'New Concept',
    },
    {
      key: 'primitive',
      backgroundColor: Product7BoxBGColour.PRIMITIVE,
      borderColor: Product7BoxBGColour.PRIMITIVE,
      description: 'Primitive',
    },
    {
      key: 'fully_defined',
      backgroundColor: Product7BoxBGColour.FULLY_DEFINED,
      borderColor: Product7BoxBGColour.FULLY_DEFINED,
      description: 'Fully Defined',
    },
    {
      key: 'invalid',
      backgroundColor: Product7BoxBGColour.INVALID,
      borderColor: Product7BoxBGColour.INVALID,
      description: 'Invalid',
    },
    {
      key: 'incomplete',
      backgroundColor: Product7BoxBGColour.INCOMPLETE,
      borderColor: Product7BoxBGColour.INCOMPLETE,
      description: 'Incomplete',
    },
    {
      key: 'property_change',
      backgroundColor: Product7BoxBGColour.PROPERTY_CHANGE,
      borderColor: Product7BoxBGColour.PROPERTY_CHANGE,
      description: 'Property Change',
    },
  ],
};

export default function ColorLegend({
  showLegend = true,
  config = LEGEND_CONFIG,
}) {
  if (!showLegend) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        mb: 2,
        p: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 1,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        {config.title}
      </Typography>

      {config.items.map(item => (
        <Box
          key={item.key}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              backgroundColor: item.backgroundColor,
              border: `1px solid ${item.borderColor}`,
              borderRadius: 1,
            }}
          />
          <Typography variant="caption">{item.description}</Typography>
        </Box>
      ))}
    </Box>
  );
}
