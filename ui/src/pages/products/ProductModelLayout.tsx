import {
  AccordionDetails,
  AccordionSummary,
  Grid,
  Link,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import {
  DefinitionStatus,
  Edge,
  Product,
  ProductModel,
} from '../../types/concept.ts';
import { useParams } from 'react-router-dom';
import { Simulate } from 'react-dom/test-utils';
import error = Simulate.error;
import conceptService from '../../api/ConceptService.ts';
import { Box } from '@mui/material';
import {
  filterByLabel,
  findProductUsingId,
  findRelations,
  isFsnToggleOn,
} from '../../utils/helpers/conceptUtils.ts';
import { experimentalStyled as styled, useTheme } from '@mui/material/styles';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Stack } from '@mui/system';
import LinkViews from './components/LinkViews.tsx';

function ProductModelLayout() {
  const [productModel, setProductModel] = useState<ProductModel>();
  const { id } = useParams();
  const lableTypesRight = ['TP', 'TPUU', 'TPP'];
  const lableTypesLeft = ['MP', 'MPUU', 'MPP'];
  const lableTypesCentre = ['CTPP'];
  const [activeConcept, setActiveConcept] = useState<string>();
  const [expandedConcepts, setExpandedConcepts] = useState<string[]>([]);
  const [fsnToggle, setFsnToggle] = useState<boolean>(isFsnToggleOn);
  const theme = useTheme();

  useEffect(() => {
    conceptService
      .getConceptModel(id as string)
      .then(e => {
        reloadStateElements();
        setProductModel(e);
      })
      .catch(error);
  }, [id, fsnToggle]);
  interface ProductTypeGroupProps {
    productLabelItems: Product[];
    label: string;
  }
  function reloadStateElements() {
    setActiveConcept(undefined);
    setExpandedConcepts([]);
    setFsnToggle(isFsnToggleOn);
  }

  function ProductTypeGroup({
    productLabelItems,
    label,
  }: ProductTypeGroupProps) {
    const Accordion = styled((props: AccordionProps) => (
      <MuiAccordion disableGutters elevation={0} square {...props} />
    ))(({ theme }) => ({
      //backgroundColor:"white",
      border: `3px solid ${theme.palette.divider}`,
      '&:not(:last-child)': {
        borderBottom: 0,
      },
      '&:before': {
        display: 'none',
      },
    }));

    const ProductPanel = (product: Product, fsnToggle: boolean) => {
      const links = activeConcept
        ? findRelations(
            productModel?.edges as Edge[],
            activeConcept,
            product.concept.conceptId,
          )
        : [];
      const accordionClicked = (conceptId: string) => {
        if (expandedConcepts.includes(conceptId)) {
          setExpandedConcepts(
            expandedConcepts.filter((value: string) => value !== conceptId),
          );
          setActiveConcept(undefined);
        } else {
          setExpandedConcepts([...expandedConcepts, conceptId]);
          setActiveConcept(conceptId);
        }
      };

      const getColorByDefinitionStatus = (): string => {
        return product.concept.definitionStatus === DefinitionStatus.Primitive
          ? '#99CCFF'
          : '#CCCCFF';
      };

      return (
        <Grid>
          <Accordion
            key={product.concept.conceptId}
            sx={{
              backgroundColor:
                activeConcept === product.concept.conceptId
                  ? theme.palette.warning.light
                  : 'white',
            }}
            onChange={() => accordionClicked(product.concept.conceptId)}
            expanded={expandedConcepts.includes(product.concept.conceptId)}
          >
            <AccordionSummary
              sx={{
                backgroundColor: getColorByDefinitionStatus,
              }}
              expandIcon={<ExpandMoreIcon />}
              //aria-expanded={true}

              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              {links.length > 0 ? (
                <Grid xs={40} item={true}>
                  <Tooltip
                    title={
                      <LinkViews
                        links={links}
                        linkedConcept={
                          findProductUsingId(
                            activeConcept as string,
                            productModel?.nodes as Product[],
                          ) as Product
                        }
                        currentConcept={product}
                        key={product.concept.conceptId}
                      />
                    }
                    componentsProps={{
                      tooltip: {
                        sx: {
                          bgcolor: '#9bddff',
                          color: '#262626',
                          border: '1px solid #888888',
                          borderRadius: '15px',
                        },
                      },
                    }}
                  >
                    <Typography>
                      <span
                        style={{ backgroundColor: theme.palette.warning.light }}
                      >
                        {fsnToggle
                          ? product.concept.fsn.term
                          : product.concept.pt.term}{' '}
                      </span>
                    </Typography>
                  </Tooltip>
                </Grid>
              ) : (
                <Grid xs={40} item={true}>
                  <Typography>
                    {fsnToggle
                      ? product.concept.fsn.term
                      : product.concept.pt.term}
                  </Typography>
                </Grid>
              )}
            </AccordionSummary>
            <AccordionDetails>
              <div>
                <Stack direction="row" spacing={2}>
                  <span style={{ color: '#184E6B' }}>Concept Id:</span>
                  <Link>{product.concept.conceptId}</Link>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Typography style={{ color: '#184E6B' }}>
                    {fsnToggle ? 'PT' : 'FSN'}:
                  </Typography>
                  <Typography>
                    {fsnToggle
                      ? product.concept.pt.term
                      : product.concept.fsn.term}
                  </Typography>
                </Stack>
              </div>
            </AccordionDetails>
          </Accordion>
        </Grid>
      );
    };
    return (
      <Grid>
        <Accordion defaultExpanded={true}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>{label}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div key={label + '-lists'}>
              {productLabelItems?.map(p => {
                return (
                  <ProductPanel
                    label={p.label}
                    concept={p.concept}
                    key={p.concept.conceptId}
                  />
                );
              })}
            </div>
          </AccordionDetails>
        </Accordion>
      </Grid>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        <Grid xs={6} key={'left'} item={true}>
          {lableTypesLeft.map(label => (
            <ProductTypeGroup
              key={label}
              label={label}
              productLabelItems={filterByLabel(
                productModel?.nodes as Product[],
                label,
              )}
            />
          ))}
        </Grid>
        <Grid xs={6} key={'right'} item={true}>
          {lableTypesRight.map(label => (
            <ProductTypeGroup
              label={label}
              key={label}
              productLabelItems={filterByLabel(
                productModel?.nodes as Product[],
                label,
              )}
            />
          ))}
        </Grid>
        <Grid xs={12} key={'bottom'} item={true}>
          {lableTypesCentre.map(label => (
            <ProductTypeGroup
              label={label}
              key={label}
              productLabelItems={filterByLabel(
                productModel?.nodes as Product[],
                label,
              )}
            />
          ))}
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProductModelLayout;
