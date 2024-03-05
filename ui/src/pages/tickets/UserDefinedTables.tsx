import { Stack } from '@mui/system';
import {
  useDeleteUiSearchConfiguration,
  useUiSearchConfiguration,
  useUpdateUiSearchConfigurations,
} from '../../hooks/api/tickets/useUiSearchConfiguration';
import { UserDefinedTicketTable } from './components/grid/UserDefinedTicketTable';
import { Button, Grid, useTheme } from '@mui/material';
import Loading from '../../components/Loading';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import UserDefinedTableActionBar from './components/UserDefinedTableActionBar';
import { Id, UiSearchConfiguration } from '../../types/tickets/ticket';
import Droppable from './components/Droppable';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { PlusCircleOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmationModal from '../../themes/overrides/ConfirmationModal';
import AddUiConfigurationModal from './components/AddUiConfigurationModal';

import { DeleteForever } from '@mui/icons-material';
import IconButton from '../../components/@extended/IconButton';

import { SortableContext } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import UiConfigurationDraggable from './components/Draggable';

export default function UserDefinedTables() {
  const { isLoading, data } = useUiSearchConfiguration();
  const [editable, setEditable] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [quadrantToAdd, setQuadrantToAdd] = useState<number | undefined>();

  // dnd-kit variables
  const [activeConfiguration, setActiveConfiguration] = useState<
    UiSearchConfiguration | undefined
  >();
  const [dndItems, setDndItems] = useState<
    (
      | UiSearchConfiguration
      | {
          id: Id;
          grouping: number;
        }
    )[]
  >();
  const dndItemsId = useMemo(
    () => dndItems?.map(item => item.id),
    [dndItems],
  ) as (UniqueIdentifier | { id: UniqueIdentifier })[];

  useEffect(() => {
    console.log(dndItems);
  }, [dndItems]);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 15,
    },
  });

  const sensors = useSensors(
    useSensor(MouseSensor),
    pointerSensor,
    useSensor(KeyboardSensor),
    useSensor(TouchSensor),
  );
  const mutation = useUpdateUiSearchConfigurations();
  const { data: putData, isLoading: putLoading, isError } = mutation;

  // eslint-disable-next-line
  function handleDragEnd(event: DragEndEvent) {
    const filteredUiSearchConfiguration = dndItems?.filter(item => {
      return checkFilterExists(item);
    }) as UiSearchConfiguration[];

    mutation.mutate(filteredUiSearchConfiguration);
  }

  const queryClient = useQueryClient();
  useEffect(() => {
    if (putData) {
      void queryClient.invalidateQueries({
        queryKey: ['ui-search-configuration'],
      });
    }
  }, [putData, putLoading, isError, queryClient]);

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === 'Table') {
      // eslint-disable-next-line
      setActiveConfiguration(event.active.data.current.uiSearchConfiguration);
      return;
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);

    if (activeId === overId) return;

    const isActiveAConfig = active.data.current?.type === 'Table';
    const isOverAConfig = over.data.current?.type === 'Table';
    const isOverEmpty = over.data.current?.type === 'none';

    if (!isActiveAConfig) return;

    // Im dropping a Table over an empty Square
    if (isActiveAConfig && (isOverEmpty || isOverAConfig)) {
      const items = dndItems as (
        | UiSearchConfiguration
        | {
            id: number;
            grouping: number;
          }
      )[];
      const activeIndex = items.findIndex(t => t.grouping === activeId);
      const overIndex = items.findIndex(t => t.grouping === overId);

      if (items[activeIndex].grouping != items[overIndex].grouping) {
        // swap the positions of the empty square and the configuration
        const tempGrouping = items[activeIndex].grouping;
        items[activeIndex].grouping = items[overIndex].grouping;
        items[overIndex].grouping = tempGrouping;
        const sortedItems = sortByGrouping(items);
        setDndItems([...sortedItems]);
      }
    }
  }

  const sortByGrouping = (
    items: (
      | UiSearchConfiguration
      | {
          id: Id;
          grouping: number;
        }
    )[],
  ) => {
    return items.sort((item1, item2) => item1.grouping - item2.grouping);
  };

  const handleAddModalOpen = useCallback(
    (bool: boolean, quadrant: number | undefined) => {
      setAddModalOpen(bool);
      setQuadrantToAdd(quadrant);
    },
    [setAddModalOpen, setQuadrantToAdd],
  );

  const findByGrouping = (
    configurations: UiSearchConfiguration[] | undefined,
    grouping: number,
  ) => {
    return configurations
      ? configurations.find(item => {
          return item.grouping === grouping;
        })
      : undefined;
  };

  useEffect(() => {
    const createItems = () => {
      const configs = data;
      // Create an array with 4 items
      const result = Array.from(
        { length: 4 },
        (_, index): UiSearchConfiguration | { id: Id; grouping: number } => {
          // Check if there is a UiSearchConfiguration with grouping equal to the index
          const config = configs?.find(config => config.grouping === index);

          // If a configuration is found, return it, otherwise return an object with just the index
          return config ? config : { id: index, grouping: index };
        },
      );
      return result;
    };
    setDndItems(createItems());
  }, [data]);
  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <AddUiConfigurationModal
            open={addModalOpen}
            quadrant={quadrantToAdd}
            handleClose={() => setAddModalOpen(!addModalOpen)}
          />
          <UserDefinedTableActionBar
            editable={editable}
            setEditable={setEditable}
          />
          <Stack
            style={{
              gap: '1em',
              height: 'calc(100% - 38px)',
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {editable ? (
              <DndContext
                onDragEnd={handleDragEnd}
                onDragOver={onDragOver}
                onDragStart={onDragStart}
                sensors={sensors}
              >
                <SortableContext items={dndItemsId}>
                  {dndItems?.map(item => (
                    <UserDefinedTableQuadrantDnd
                      key={item.grouping}
                      uiSearchConfiguration={item}
                      quadrant={item.grouping}
                      handleAddModalOpen={handleAddModalOpen}
                      active={false}
                    />
                  ))}
                </SortableContext>
                {createPortal(
                  <DragOverlay>
                    {activeConfiguration ? (
                      <UserDefinedTableQuadrantDnd
                        active={true}
                        uiSearchConfiguration={activeConfiguration}
                        quadrant={activeConfiguration.grouping}
                        handleAddModalOpen={handleAddModalOpen}
                      />
                    ) : null}
                  </DragOverlay>,
                  document.body,
                )}
              </DndContext>
            ) : (
              <>
                <>
                  <UserDefinedTableQuadrant
                    allConfigurations={data}
                    uiSearchConfiguration={findByGrouping(data, 0)}
                    count={data?.length}
                  />
                  <UserDefinedTableQuadrant
                    allConfigurations={data}
                    uiSearchConfiguration={findByGrouping(data, 1)}
                    count={data?.length}
                  />
                  <UserDefinedTableQuadrant
                    allConfigurations={data}
                    uiSearchConfiguration={findByGrouping(data, 2)}
                    count={data?.length}
                  />
                  <UserDefinedTableQuadrant
                    allConfigurations={data}
                    uiSearchConfiguration={findByGrouping(data, 3)}
                    count={data?.length}
                  />
                </>
              </>
            )}
          </Stack>
        </>
      )}
    </>
  );
}

interface UserDefinedTableQuadrantProps {
  uiSearchConfiguration?: UiSearchConfiguration;
  allConfigurations?: UiSearchConfiguration[];
  count: number | undefined;
}
function UserDefinedTableQuadrant({
  uiSearchConfiguration,
  count,
  allConfigurations,
}: UserDefinedTableQuadrantProps) {
  // eslint-disable-next-line
  const [length, setLength] = useState<'50%' | '100%'>(
    calculateLength(count, allConfigurations, uiSearchConfiguration),
  );
  // eslint-disable-next-line
  const [height, setHeight] = useState<'50%' | '100%'>(
    count !== undefined && count === 1 ? '100%' : '50%',
  );

  const getGridStyle = useCallback(() => {
    return {
      minHeight: height,
      maxHeight: height,
      width: `calc(${length} - 1em)`,
      overflow: 'scroll',
    };
  }, [height, length]);

  if (!uiSearchConfiguration?.filter) return null;
  return (
    <Grid item sx={getGridStyle()}>
      <UserDefinedTicketTable uiSearchConfiguration={uiSearchConfiguration} />
    </Grid>
  );
}

const calculateLength = (
  count: number | undefined,
  allConfigurations: UiSearchConfiguration[] | undefined,
  uiSearchConfiguration: UiSearchConfiguration | undefined,
) => {
  if (allConfigurations === undefined) return '100%';
  const otherConfigurations = allConfigurations.filter(config => {
    return config.grouping !== uiSearchConfiguration?.grouping;
  });
  if (count === 1 || count === 2) return '100%';
  if (count === 4) return '50%';
  if (uiSearchConfiguration?.grouping === undefined) return '50%';
  if (uiSearchConfiguration?.grouping <= 1) {
    const val = otherConfigurations.find(config => config.grouping <= 1);
    return val ? '50%' : '100%';
  }
  if (uiSearchConfiguration?.grouping >= 2) {
    const val = otherConfigurations.find(config => config.grouping >= 2);
    return val ? '50%' : '100%';
  }
  return '100%';
};

interface UserDefinedTableQuadrantDndProps {
  uiSearchConfiguration:
    | UiSearchConfiguration
    | { id: number; grouping: number };
  quadrant: number;
  handleAddModalOpen: (bool: boolean, quadrant: number) => void;
  active: boolean;
}
function UserDefinedTableQuadrantDnd({
  uiSearchConfiguration,
  quadrant,
  handleAddModalOpen,
  active,
}: UserDefinedTableQuadrantDndProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteUiSearchConfiguration, setDeleteUiSearchConfiguration] =
    useState<UiSearchConfiguration | undefined>();

  const mutation = useDeleteUiSearchConfiguration();
  const { data } = mutation;

  const filterExists = useFilterExists(uiSearchConfiguration);

  const handleOpenDeleteModal = (
    bool: boolean,
    uiSearchConfiguration: UiSearchConfiguration,
  ) => {
    setDeleteUiSearchConfiguration(uiSearchConfiguration);
    setDeleteModalOpen(bool);
  };

  const handleDeleteUiSearchConfiguration = () => {
    if (deleteUiSearchConfiguration === undefined) return;
    mutation.mutate(deleteUiSearchConfiguration?.id);
  };

  const queryClient = useQueryClient();
  const theme = useTheme();

  useEffect(() => {
    if (data) {
      void queryClient.invalidateQueries({
        queryKey: ['ui-search-configuration'],
      });
      setDeleteUiSearchConfiguration(undefined);
      setDeleteModalOpen(false);
    }
  }, [data, queryClient]);

  const renderUiConfiguration = useCallback(() => {
    return (
      <Stack sx={{ height: '100%', width: '100%' }}>
        {/* If theres a filter, it needs to be drag + drop, else we render the add table button */}
        {filterExists && (
          <UiConfigurationDraggable
            id={quadrant}
            sx={{ height: '100%', width: '100%' }}
            uiSearchConfiguration={
              uiSearchConfiguration as UiSearchConfiguration
            }
          >
            <UserDefinedUiSearchConfigurationDnd
              uiSearchConfiguration={
                uiSearchConfiguration as UiSearchConfiguration
              }
              handleOpenDeleteModal={handleOpenDeleteModal}
            />
          </UiConfigurationDraggable>
        )}
        {!filterExists && (
          <Stack
            sx={{
              alignSelf: 'center',
            }}
          >
            <Button
              variant="contained"
              color="success"
              startIcon={<PlusCircleOutlined />}
              sx={{ marginLeft: 'auto' }}
              onClick={() => handleAddModalOpen(true, quadrant)}
            >
              Add Table
            </Button>
          </Stack>
        )}
      </Stack>
    );
  }, [uiSearchConfiguration, filterExists, handleAddModalOpen, quadrant]);

  const table = renderUiConfiguration();

  return (
    <Stack
      sx={{
        width: active ? '100%' : 'calc(50% - 1em)',
        height: active ? '100%' : 'calc(50% - 1em)',
      }}
    >
      <ConfirmationModal
        open={deleteModalOpen}
        handleClose={() => setDeleteModalOpen(!deleteModalOpen)}
        title="Are you sure?"
        content={`Confirm delete for ${deleteUiSearchConfiguration?.filter.name}`}
        action="Delete"
        reverseAction="Back"
        handleAction={handleDeleteUiSearchConfiguration}
      />
      <Droppable
        id={quadrant}
        sx={{
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          maxWidth: '100%',
          border: `2px dotted ${theme.palette.grey[400]}`,
          borderRadius: '20px',
          backgroundColor: theme.palette.grey[200],
        }}
        uiSearchConfiguration={uiSearchConfiguration}
      >
        {table}
      </Droppable>
    </Stack>
  );
}
interface UserDefinedUiSearchConfigurationDndProps {
  handleOpenDeleteModal: (
    bool: boolean,
    uiSearchConfiguration: UiSearchConfiguration,
  ) => void;
  uiSearchConfiguration: UiSearchConfiguration;
}
function UserDefinedUiSearchConfigurationDnd({
  handleOpenDeleteModal,
  uiSearchConfiguration,
}: UserDefinedUiSearchConfigurationDndProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Stack
      position="relative"
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      ref={containerRef}
    >
      <IconButton
        color="error"
        variant="contained"
        sx={{ position: 'absolute', top: '1em', right: '1em', zIndex: 1000 }}
        onClick={() => {
          handleOpenDeleteModal(true, uiSearchConfiguration);
        }}
      >
        <DeleteForever />
      </IconButton>
      {uiSearchConfiguration.filter?.name}
    </Stack>
  );
}

export function useFilterExists(
  uiSearchConfiguration:
    | UiSearchConfiguration
    | { id: number; grouping: number },
) {
  const [filterExists, setFilterExists] = useState(false);
  useEffect(() => {
    setFilterExists(checkFilterExists(uiSearchConfiguration));
  }, [uiSearchConfiguration]);

  return filterExists;
}

const checkFilterExists = (
  uiSearchConfiguration:
    | UiSearchConfiguration
    | { id: number; grouping: number },
) => {
  if ('filter' in uiSearchConfiguration) return true;
  return false;
};
