import { Box, FormControlLabel, Grid, Switch, Typography } from '@mui/material';
import { Ticket } from '../../types/tickets/ticket';
import { useParams } from 'react-router-dom';
// import { ExistingDescriptionsSection } from './ProductEditModal';
import { useMemo, useState } from 'react';
import useAvailableProjects, {
  getProjectFromKey,
} from '../../hooks/api/useInitializeProjects';
import { useApplicationConfig } from '../../hooks/api/useInitializeConfig';
import { LanguageRefset } from '../../types/Project';
import {
  ExternalIdentifier,
  isProductUpdateDetails,
} from '../../types/product';
import {
  findDefaultLangRefset,
  sortDescriptions,
} from '../../utils/helpers/conceptUtils';
import { useExternalIdentifiers } from '../../hooks/api/products/useExternalIdentifiers';
import { useSearchConceptByIdNoCache } from '../../hooks/api/products/useSearchConcept';
import { BrowserConcept } from '../../types/concept';
import { ExistingDescriptionsSection } from './ExistingDescriptionsSection';
import useProjectLangRefsets from '../../hooks/api/products/useProjectLangRefsets';

const USLangRefset: LanguageRefset = {
  default: 'false',
  en: '900000000000509007',
  dialectName: 'US',
  readOnly: 'false',
};

interface ProductEditViewProps {
  ticket: Ticket;
}
function ProductEditView({ ticket }: ProductEditViewProps) {
  const { updateId, branchKey } = useParams();
  const [displayRetiredDescriptions, setDisplayRetiredDescriptions] =
    useState(false);
  const { applicationConfig } = useApplicationConfig();
  const { data: projects } = useAvailableProjects();
  const project = getProjectFromKey(applicationConfig?.apProjectKey, projects);
  const langRefsets = useProjectLangRefsets({ project: project });

  const defaultLangrefset = findDefaultLangRefset(langRefsets);

  const productUpdate = ticket.bulkProductActions?.find(productAction => {
    return productAction.id === parseInt(updateId ? updateId : '');
  });

  const updatedConcept = isProductUpdateDetails(productUpdate?.details)
    ? productUpdate?.details.updatedState.concept
    : undefined;

  const branch = `/${applicationConfig?.apDefaultBranch}${branchKey ? `/${branchKey}` : ''}`;

  const { data: currentConcept, isFetching } = useSearchConceptByIdNoCache(
    updatedConcept?.conceptId,
    branch,
  );

  const currentDescriptions = sortDescriptions(
    currentConcept?.descriptions,
    defaultLangrefset,
  );
  const { data: externalIdentifiers } = useExternalIdentifiers(
    updatedConcept?.conceptId,
    branch,
  );

  const historicDescriptions = isProductUpdateDetails(productUpdate?.details)
    ? sortDescriptions(
        productUpdate?.details.historicState.concept.descriptions,
        defaultLangrefset,
      )
    : undefined;

  const historicExternalIdentifiers = isProductUpdateDetails(
    productUpdate?.details,
  )
    ? productUpdate?.details.historicState.externalIdentifiers
    : undefined;

  const updatedDescriptions = sortDescriptions(
    updatedConcept?.descriptions,
    defaultLangrefset,
  );

  const updatedExternalIdentifiers = isProductUpdateDetails(
    productUpdate?.details,
  )
    ? productUpdate?.details.updatedState.externalIdentifiers
    : undefined;

  const containsExternalIdentifiers =
    (updatedExternalIdentifiers && updatedExternalIdentifiers?.length > 0) ||
    (historicExternalIdentifiers && historicExternalIdentifiers?.length > 0);

  const displayConceptDifference = hasConceptBeenChanged(
    updatedConcept,
    currentConcept,
    updatedExternalIdentifiers,
    externalIdentifiers,
    defaultLangrefset,
  );
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column', // Changed to row for horizontal columns
      }}
    >
      <Typography variant="h4">
        {formatConceptUpdate(
          updatedConcept?.conceptId,
          productUpdate?.details.productId,
          productUpdate?.created,
        )}
      </Typography>
      <Grid container direction="row" spacing={1} sx={{ width: '100%' }}>
        {/* First Column */}
        <Grid item xs={6}>
          <Box
            sx={{
              height: '100%',
            }}
          >
            <ExistingDescriptionsSection
              displayRetiredDescriptions={displayRetiredDescriptions}
              descriptions={historicDescriptions}
              isFetching={false}
              isCtpp={
                containsExternalIdentifiers
                  ? containsExternalIdentifiers
                  : false
              }
              //   product={undefined}
              externalIdentifiers={historicExternalIdentifiers}
              title={'Old'}
              dialects={langRefsets}
              displayMode="input"
              showBorder
            />
          </Box>
        </Grid>

        {/* Second Column */}
        <Grid item xs={6}>
          <Box
            sx={{
              height: '100%',
            }}
          >
            <ExistingDescriptionsSection
              displayRetiredDescriptions={displayRetiredDescriptions}
              descriptions={updatedDescriptions}
              isFetching={false}
              isCtpp={
                containsExternalIdentifiers
                  ? containsExternalIdentifiers
                  : false
              }
              title={'Updated'}
              externalIdentifiers={updatedExternalIdentifiers}
              dialects={langRefsets}
              displayMode="input"
              showBorder
            />
          </Box>
        </Grid>
      </Grid>
      <Grid>
        {displayConceptDifference && (
          <ExistingDescriptionsSection
            displayRetiredDescriptions={displayRetiredDescriptions}
            descriptions={currentDescriptions}
            isFetching={isFetching}
            isCtpp={
              externalIdentifiers ? externalIdentifiers.length > 0 : false
            }
            title={'Current state'}
            externalIdentifiers={externalIdentifiers}
            dialects={langRefsets}
            displayMode="input"
            showBorder
          />
        )}
      </Grid>
      <FormControlLabel
        control={
          <Switch
            color="primary"
            checked={displayRetiredDescriptions}
            onChange={() => {
              setDisplayRetiredDescriptions(!displayRetiredDescriptions);
            }}
            disabled={false}
          />
        }
        label="Display Retired Descriptions"
        labelPlacement="start"
        sx={{
          '& .MuiSwitch-root': {
            padding: 0,
          },
          paddingRight: '5em',
        }}
      />
    </Box>
  );
}

function hasConceptBeenChanged(
  updatedConcept: BrowserConcept | undefined,
  currentConcept: BrowserConcept | undefined,
  updatedExternalIdentifiers: ExternalIdentifier[] | undefined,
  currentExternalIdentifiers: ExternalIdentifier[] | undefined,
  defaultLangRefset: LanguageRefset | undefined,
): boolean {
  const currentDescriptions = sortDescriptions(
    currentConcept?.descriptions,
    defaultLangRefset,
  );
  const updatedDescriptions = sortDescriptions(
    updatedConcept?.descriptions,
    defaultLangRefset,
  );

  // Check if the number of descriptions changed
  if (currentDescriptions.length !== updatedDescriptions.length) {
    return true;
  }

  // Check if any descriptions have been modified
  for (let i = 0; i < updatedDescriptions.length; i++) {
    const updatedDesc = updatedDescriptions[i];

    // Find matching description in current concept
    const matchingDesc = currentDescriptions.find(
      desc => desc.descriptionId === updatedDesc.descriptionId,
    );

    // If a description doesn't exist in current concept, it's new
    if (!matchingDesc) {
      return true;
    }

    // Check for modifications in existing descriptions
    if (
      updatedDesc.term !== matchingDesc.term ||
      updatedDesc.active !== matchingDesc.active ||
      updatedDesc.moduleId !== matchingDesc.moduleId ||
      updatedDesc.typeId !== matchingDesc.typeId ||
      updatedDesc.lang !== matchingDesc.lang ||
      updatedDesc.caseSignificance !== matchingDesc.caseSignificance
    ) {
      return true;
    }

    // Check acceptabilityMap changes
    const updatedAcceptMap = updatedDesc.acceptabilityMap || {};
    const currentAcceptMap = matchingDesc.acceptabilityMap || {};

    // Check if dialect keys are different
    const updatedDialects = Object.keys(updatedAcceptMap);
    const currentDialects = Object.keys(currentAcceptMap);

    if (updatedDialects.length !== currentDialects.length) {
      return true;
    }

    // Check if any acceptability values changed
    for (const dialect of updatedDialects) {
      if (
        !currentAcceptMap[dialect] ||
        updatedAcceptMap[dialect] !== currentAcceptMap[dialect]
      ) {
        return true;
      }
    }
  }

  // Handle the case where either array is undefined or null
  const updatedIds = updatedExternalIdentifiers || [];
  const currentIds = currentExternalIdentifiers || [];

  // Check if the number of external identifiers changed
  if (updatedIds.length !== currentIds.length) {
    return true;
  }

  // Create a frequency map for current identifiers
  const currentIdFrequencyMap = new Map<string, Map<string, number>>();

  for (const id of currentIds) {
    const key = id.identifierScheme;
    const value = id.identifierValue;

    if (!currentIdFrequencyMap.has(key)) {
      currentIdFrequencyMap.set(key, new Map<string, number>());
    }

    const valueMap = currentIdFrequencyMap.get(key)!;
    valueMap.set(value, (valueMap.get(value) || 0) + 1);
  }

  // Create a frequency map for updated identifiers
  const updatedIdFrequencyMap = new Map<string, Map<string, number>>();

  for (const id of updatedIds) {
    const key = id.identifierScheme;
    const value = id.identifierValue;

    if (!updatedIdFrequencyMap.has(key)) {
      updatedIdFrequencyMap.set(key, new Map<string, number>());
    }

    const valueMap = updatedIdFrequencyMap.get(key)!;
    valueMap.set(value, (valueMap.get(value) || 0) + 1);
  }

  // Check if the schemes match between current and updated
  if (currentIdFrequencyMap.size !== updatedIdFrequencyMap.size) {
    return true;
  }

  // Compare the frequency maps
  for (const [scheme, valueMapCurrent] of currentIdFrequencyMap.entries()) {
    const valueMapUpdated = updatedIdFrequencyMap.get(scheme);

    // If this scheme doesn't exist in updated identifiers
    if (!valueMapUpdated) {
      return true;
    }

    // Check if the values and their frequencies match
    if (valueMapCurrent.size !== valueMapUpdated.size) {
      return true;
    }

    for (const [value, count] of valueMapCurrent.entries()) {
      const updatedCount = valueMapUpdated.get(value) || 0;

      if (count !== updatedCount) {
        return true;
      }
    }
  }

  // If no changes were found, return false
  return false;
}

function formatConceptUpdate(
  conceptId: string | undefined,
  productId: string | undefined,
  utcDateTime: string | undefined,
) {
  if (!utcDateTime) {
    return (
      <>
        Updates made to concept: {conceptId} on product: {productId}
      </>
    );
  }
  const date = new Date(utcDateTime);

  const localDate = date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return (
    <>
      Updates made to concept: {conceptId} on {localDate} on product:{' '}
      {productId}
    </>
  );
}
export default ProductEditView;
