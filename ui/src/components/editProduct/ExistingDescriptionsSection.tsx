import { InputLabel } from "@mui/material";
import { MenuItem } from "@mui/material";
import { Box } from "@mui/material";
import { Chip } from "@mui/material";
import { TextField } from "@mui/material";
import { Switch } from "@mui/material";
import { Typography } from "@mui/material";
import { Select } from "@mui/material";
import { FormControl } from "@mui/material";
import { Grid } from "@mui/material";
import { CaseSignificance, DefinitionType, Description, Product, caseSignificanceDisplay } from "../../types/concept";
import Loading from "../Loading";
import { NonDefiningProperty } from "../../types/product";
import { LanguageRefset } from "../../types/Project";
import { InnerBoxSmall } from "../../pages/products/components/style/ProductBoxes";
import AdditionalPropertiesDisplay from "../../pages/products/components/AdditionalPropertiesDisplay";
import { Divider } from "@mui/material";


  
  interface DescriptionDisplayProps {
    description: Description;
    dialects: LanguageRefset[];
    index: number;
    displayMode: 'input' | 'text';
    isPreferredTerm: boolean;
  }
  
  // Individual Description Display Component
  export function DescriptionDisplay({
    description,
    dialects,
    index,
    displayMode,
    isPreferredTerm
  }: DescriptionDisplayProps) {
    const label =
      description.type === 'FSN'
        ? 'FSN'
        : isPreferredTerm
          ? 'Preferred Term'
          : 'Synonym';
  
    const handleFieldChange = (field: string, value: any) => {
      if (onDescriptionChange) {
        onDescriptionChange(index, field, value);
      }
    };
  
    return (
      <Grid
        container
        spacing={1}
        key={`${description.descriptionId}-${index}`}
        alignItems="center"
      >
        {/* Type Column */}
        <Grid item xs={12} md={2}>
          {displayMode === 'input' ? (
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Type</InputLabel>
              <Select
                margin="dense"
                value={description.type}
                disabled
              >
                {Object.values(DefinitionType).map((value: string) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {description.type}
            </Typography>
          )}
        </Grid>
  
        {/* Term Column */}
        <Grid item xs={12} md={5}>
          <Box display="flex" alignItems="center" gap={1}>
            {displayMode === 'input' ? (
              <Switch
                disabled
                checked={description.active}
                color="primary"
                size="small"
              />
            ) : (
              <Chip
                label={description.active ? 'Active' : 'Inactive'}
                color={description.active ? 'success' : 'default'}
                size="small"
                variant="outlined"
              />
            )}
            <Typography variant="subtitle2">{label}</Typography>
          </Box>
          
          {displayMode === 'input' ? (
            <TextField
              fullWidth
              variant="outlined"
              margin="dense"
              multiline
              minRows={1}
              maxRows={4}
              value={description.term || ''}
              disabled
            />
          ) : (
            <Typography variant="body1" sx={{ mt: 1 }}>
              {description.term || 'No term provided'}
            </Typography>
          )}
        </Grid>
  
        {/* Dialect Acceptability Column */}
        <Grid item xs={12} md={3}>
          <Grid container direction="column" spacing={1}>
            {dialects.map(dialect => (
              <Grid item xs={12} md={1.5} key={dialect.en}>
                {displayMode === 'input' ? (
                  <FormControl fullWidth margin="dense" size="small">
                    <InputLabel>{dialect.dialectName}</InputLabel>
                    <Select
                      disabled
                      value={description.acceptabilityMap?.[dialect.en] || 'NOT ACCEPTABLE'}
                    >
                      {['PREFERRED', 'ACCEPTABLE'].map((value: string) => (
                        <MenuItem key={value} value={value}>
                          {value}
                        </MenuItem>
                      ))}
                      <MenuItem value={'NOT ACCEPTABLE'}>
                        NOT ACCEPTABLE
                      </MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {dialect.dialectName}
                    </Typography>
                    <Typography variant="body2">
                      {description.acceptabilityMap?.[dialect.en] || 'NOT ACCEPTABLE'}
                    </Typography>
                  </Box>
                )}
              </Grid>
            ))}
          </Grid>
        </Grid>
  
        {/* Case Sensitivity Column */}
        <Grid item xs={12} md={2}>
          {displayMode === 'input' ? (
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel>Case Sensitivity</InputLabel>
              <Select
                disabled={true}
                value={description.caseSignificance}
              >
                {Object.values(CaseSignificance).map(value => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Case Sensitivity
              </Typography>
              <Typography variant="body2">
                {caseSignificanceDisplay[description.caseSignificance] }
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    );
  }
  
  // List of Descriptions Component
  interface DescriptionListProps {
    descriptions: Description[] | undefined;
    dialects: LanguageRefset[];
    displayMode: 'input' | 'text';
    displayRetiredDescriptions: boolean;
    isFetching: boolean;
    onDescriptionChange?: (index: number, field: string, value: any) => void;
  }
  
  export function DescriptionList({
    descriptions,
    dialects,
    displayMode,
    displayRetiredDescriptions,
    isFetching,
    onDescriptionChange
  }: DescriptionListProps) {
    // Function to determine preferred term based on AU dialect
    const isPreferredTerm = (description: Description): boolean => {
      const defaultDialectKey = dialects.find(langRefsets => {
        return langRefsets.default === 'true';
      });
      return (
        description.type === 'SYNONYM' &&
        defaultDialectKey !== undefined &&
        description.acceptabilityMap?.[defaultDialectKey.en] === 'PREFERRED'
      );
    };
  
    if (isFetching) {
      return <Loading />;
    }
  
    return (
      <Box>
        {descriptions?.map((description, index) => {
          if (!displayRetiredDescriptions && !description.active) {
            return null;
          }
  
          const isPreferred = isPreferredTerm(description);
          
          return (
            <Box key={`${description.descriptionId}-${index}`}>
              <DescriptionDisplay
                description={description}
                dialects={dialects}
                index={index}
                displayMode={displayMode}
                isPreferredTerm={isPreferred}
                onDescriptionChange={onDescriptionChange}
              />
              {index < descriptions.length - 1 && (
                <Divider sx={{ width: '100%', my: 1 }} />
              )}
            </Box>
          );
        })}
      </Box>
    );
  }

  interface ExistingDescriptionsSectionProps {
    displayRetiredDescriptions: boolean;
    isFetching: boolean;
    nonDefiningProperties?: NonDefiningProperty[];
    descriptions?: Description[];
    isCtpp: boolean;
    dialects: LanguageRefset[];
    title: string;
    product: Product;
    branch: string;
    displayMode: 'input' | 'text';
    showBorder: boolean;
  }
  
  // Updated ExistingDescriptionsSection Component
  export function ExistingDescriptionsSection({
    displayRetiredDescriptions,
    isFetching,
    descriptions,
    isCtpp,
    dialects,
    title,
    nonDefiningProperties,
    product,
    branch,
    displayMode = 'input',
    showBorder
  }: ExistingDescriptionsSectionProps & { displayMode?: 'input' | 'text' }) {
  
    return (
      <Grid
        item
        xs={12}
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" marginBottom={1}>
          {title}
        </Typography>
        <Box
          border={showBorder ? 0.1 : 0}
          borderColor="grey.200"
          padding={2}
          sx={{
            height: '100%',
            width: '100%',
            flexGrow: 1,
          }}
        >
          {/* FSN and Synonyms Section */}
          <InnerBoxSmall component="fieldset">
            <DescriptionList
              descriptions={descriptions}
              dialects={dialects}
              displayMode={displayMode}
              displayRetiredDescriptions={displayRetiredDescriptions}
              isFetching={isFetching}
            />
          </InnerBoxSmall>
  
          <AdditionalPropertiesDisplay
            product={product}
            branch={branch}
            showWrapper={false}
          />
        </Box>
      </Grid>
    );
  }