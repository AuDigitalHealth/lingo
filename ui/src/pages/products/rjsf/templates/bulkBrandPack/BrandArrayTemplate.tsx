import React from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicationIcon from '@mui/icons-material/Medication';
import { FieldChips } from '../../../components/ArtgFieldChips.tsx';
import { sortExternalIdentifiers } from '../../../../../utils/helpers/tickets/additionalFieldsUtils.ts';

const BrandArrayTemplate: React.FC<ArrayFieldTemplateProps> = props => {
  const { items, uiSchema } = props;
  const options = uiSchema['ui:options'] || {};
  const listTitle = options.listTitle || 'Brands';
  const isReadOnly = options.readOnly || false;

  return (
    <Box sx={{ width: '100%' }}>
      <ListSubheader>{listTitle}</ListSubheader>
      <List sx={{ mb: 1 }}>
        {items.map((item, index) =>
          item.children.props.formData.brand ? (
            <ListItem
              key={item.key || index}
              secondaryAction={
                !isReadOnly &&
                item.hasRemove && (
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={item.onDropIndexClick(index)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )
              }
            >
              <ListItemAvatar>
                <Avatar>
                  <MedicationIcon />
                </Avatar>
              </ListItemAvatar>
              <Box>
                <ListItemText
                  primary={item.children.props.formData.brand.pt?.term}
                />
                <FieldChips
                  items={sortExternalIdentifiers(
                    item.children.props.formData.externalIdentifiers,
                  )}
                />
              </Box>
            </ListItem>
          ) : null,
        )}
      </List>
    </Box>
  );
};

export default BrandArrayTemplate;
