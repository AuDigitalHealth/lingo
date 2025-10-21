import React, { useEffect, useState } from 'react';
import { ArrayFieldTemplateProps } from '@rjsf/utils';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SearchAndAddIcon from '../../../../components/icons/SearchAndAddIcon';
import SearchAndAddProduct from '../components/SearchAndAddProduct.tsx';
import useSearchAndAddProduct from '../hooks/useSearchAndAddProduct.ts';
import { getFormDataById, getItemTitle } from '../helpers/helpers.ts';
import { isEmptyObjectByValue } from '../../../../utils/helpers/conceptUtils.ts';
import ChangeIndicator from '../components/ChangeIndicator.tsx';
import { compareByValue } from '../helpers/comparator.ts';

const containerStyle = {
  marginBottom: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
};

// Sortable item component
interface SortableItemProps {
  id: string;
  element: any;
  itemTitle: string;
  expandedPanels: string[];
  handleChange: (
    panel: string,
  ) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  idSchema: any;
  orderable: boolean;
}

const SortableItem: React.FC<SortableItemProps> = ({
  id,
  element,
  itemTitle,
  expandedPanels,
  handleChange,
  idSchema,
  orderable,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const panelId = `panel${element.index}`;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      data-testid={`${idSchema.$id}_${element.index}_container`}
    >
      <Accordion
        expanded={expandedPanels.includes(panelId)}
        onChange={handleChange(panelId)}
        sx={containerStyle}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          {/* Drag handle */}
          {orderable && (
            <Box
              {...attributes}
              {...listeners}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'grab',
                '&:active': {
                  cursor: 'grabbing',
                },
                color: 'text.secondary',
                mr: 1,
              }}
            >
              <DragIndicatorIcon />
            </Box>
          )}

          <Typography sx={{ flexGrow: 1, marginTop: '8px;' }}>
            {itemTitle}
          </Typography>

          {element.hasRemove && (
            <IconButton
              onClick={e => {
                e.stopPropagation(); // Prevent accordion toggle
                element.onDropIndexClick(element.index)(e);
              }}
            >
              <RemoveCircleOutlineIcon color="error" />
            </IconButton>
          )}
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {React.cloneElement(element.children, { title: itemTitle })}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

const AccordionArrayFieldTemplate: React.FC<ArrayFieldTemplateProps> = ({
  items,
  canAdd,
  onAddClick,
  title,
  uiSchema,
  formData,
  formContext,
  idSchema,
}) => {
  // Get expansion options from uiSchema
  const uiOptions = uiSchema?.['ui:options'] || {};
  const defaultExpanded = uiOptions.defaultExpanded === true;
  const initiallyExpanded = uiOptions.initiallyExpanded === true;
  const shouldExpandByDefault = defaultExpanded || initiallyExpanded;
  const orderable = uiOptions.orderable === true;
  const showDiff =
    formContext?.mode === 'update' &&
    !isEmptyObjectByValue(formContext?.snowStormFormData);

  const originalValue = getFormDataById(
    formContext?.snowStormFormData,
    idSchema.$id,
  );

  // Initialize expandedPanels state based on options
  const [expandedPanels, setExpandedPanels] = useState<string[]>(() => {
    if (shouldExpandByDefault) {
      // Expand all panels by default
      return items.map((_, index) => `panel${index}`);
    }
    return [];
  });

  // Update expandedPanels when items length changes and default expansion is enabled
  useEffect(() => {
    // Only auto-expand new items if we're set to expand by default
    if (shouldExpandByDefault && items.length > 0) {
      const currentPanelIds = expandedPanels;
      const allPanelIds = items.map((_, index) => `panel${index}`);

      // Find panels that are new (not in the current expanded list)
      const newPanelIds = allPanelIds.filter(
        id => !currentPanelIds.includes(id),
      );

      // Only update if there are new panels to expand
      if (newPanelIds.length > 0) {
        setExpandedPanels(prev => [...prev, ...newPanelIds]);
      }
    }
  }, [items.length, shouldExpandByDefault]);

  const {
    openSearchModal,
    handleOpenSearchModal,
    handleCloseSearchModal,
    handleAddProduct,
  } = useSearchAndAddProduct(formContext, idSchema);

  const handleChange =
    (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
      if (isExpanded) {
        // Add this panel to the expanded list
        setExpandedPanels(prev => [...prev, panel]);
      } else {
        // Remove this panel from the expanded list
        setExpandedPanels(prev => prev.filter(p => p !== panel));
      }
    };

  // Drag and drop setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(
        item => `item-${item.index}` === active.id,
      );
      const newIndex = items.findIndex(
        item => `item-${item.index}` === over?.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        // Use the existing RJSF reorder functionality
        const item = items[oldIndex];
        if (item.onReorderClick) {
          item.onReorderClick(oldIndex, newIndex)();
        }
      }
    }
  };

  const sortableItems = items.map(item => `item-${item.index}`);

  return (
    <div data-testid={idSchema.$id + '_container'}>
      <Toolbar
        variant="dense"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '0px ! important',
          paddingRight: '17px ! important',
          gap: '0px',
        }}
      >
        {title && (
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', mt: 2, flexGrow: 1 }}
          >
            {title}
          </Typography>
        )}
        {canAdd && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '0px' }}>
            <Tooltip title="Add Manually">
              <IconButton onClick={onAddClick}>
                <AddCircleOutlineIcon color="primary" />
              </IconButton>
            </Tooltip>
            {uiSchema?.['ui:options']?.searchAndAddProduct && (
              <Tooltip title="Search and Add">
                <IconButton onClick={handleOpenSearchModal}>
                  <SearchAndAddIcon width="20px" />
                </IconButton>
              </Tooltip>
            )}
          </div>
        )}

        {uiSchema?.['ui:options']?.searchAndAddProduct && (
          <SearchAndAddProduct
            open={openSearchModal}
            onClose={handleCloseSearchModal}
            onAddProduct={handleAddProduct}
            uiSchema={uiSchema}
          />
        )}
        <div style={{ marginTop: '10px', display: 'flex', gap: '0px' }}>
          <ChangeIndicator
            value={items.length}
            originalValue={originalValue ? originalValue.length : undefined}
            id={idSchema.$id}
            alwaysShow={showDiff}
            comparator={compareByValue}
            displayArraySize={true}
          />
        </div>
      </Toolbar>

      {orderable ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableItems}
            strategy={verticalListSortingStrategy}
          >
            {items.map(element => {
              const itemTitle = getItemTitle(uiSchema, formData, element.index);
              const id = `item-${element.index}`;

              return (
                <SortableItem
                  key={id}
                  id={id}
                  element={element}
                  itemTitle={itemTitle}
                  expandedPanels={expandedPanels}
                  handleChange={handleChange}
                  idSchema={idSchema}
                  orderable={orderable}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      ) : (
        // Non-sortable version (original implementation)
        items.map(element => {
          const itemTitle = getItemTitle(uiSchema, formData, element.index);
          const panelId = `panel${element.index}`;

          return (
            <Box
              key={element.index}
              data-testid={`${idSchema.$id}_${element.index}_container`}
            >
              <Accordion
                expanded={expandedPanels.includes(panelId)}
                onChange={handleChange(panelId)}
                sx={containerStyle}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ flexGrow: 1, marginTop: '8px;' }}>
                    {itemTitle}
                  </Typography>
                  {element.hasRemove && (
                    <IconButton
                      onClick={e => {
                        e.stopPropagation(); // Prevent accordion toggle
                        element.onDropIndexClick(element.index)(e);
                      }}
                    >
                      <RemoveCircleOutlineIcon color="error" />
                    </IconButton>
                  )}
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {React.cloneElement(element.children, { title: itemTitle })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          );
        })
      )}
    </div>
  );
};

export default AccordionArrayFieldTemplate;
