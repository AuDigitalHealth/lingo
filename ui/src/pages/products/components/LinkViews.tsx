import { Edge, Product, ProductModel } from '../../../types/concept.ts';
import { Grid } from '@mui/material';
import { Box, Stack } from '@mui/system';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { Control, useWatch } from 'react-hook-form';
import React from 'react';

export interface LinkViewsProps {
  links: Edge[];
  linkedConcept: Product;
  currentConcept: Product;
  productModel: ProductModel;
  control: Control<ProductModel>;
  fsnToggle: boolean;
}

export default function LinkViews(props: LinkViewsProps) {
  const {
    links,
    linkedConcept,
    currentConcept,
    productModel,
    control,
    fsnToggle,
  } = props;
  return (
    <Grid style={{}}>
      <Box sx={{ fontSize: '0.9rem' }}>
        {links?.map((e, index) => {
          return (
            <Grid key={index}>
              <Stack direction="row" spacing={3}>
                <span>{e.label}</span>
                {e.source === currentConcept.conceptId ? (
                  <ArrowForward />
                ) : (
                  <ArrowBack />
                )}
                {linkedConcept.newConcept ? (
                  <HeaderWatch
                    product={linkedConcept}
                    productModel={productModel}
                    fsnToggle={fsnToggle}
                    control={control}
                  />
                ) : (
                  <span>{linkedConcept.concept.fsn?.term}</span>
                )}
              </Stack>
            </Grid>
          );
        })}
      </Box>
    </Grid>
  );
}
function HeaderWatch({
  control,
  product,
  fsnToggle,
  productModel,
}: {
  control: Control<ProductModel>;
  product: Product;
  fsnToggle: boolean;
  productModel: ProductModel;
}) {
  const index = productModel.nodes.findIndex(
    x => x.conceptId === product.conceptId,
  );
  const pt = useWatch({
    control,
    name: `nodes[${index}].newConceptDetails.preferredTerm` as 'nodes.0.newConceptDetails.preferredTerm',
  });

  const fsn = useWatch({
    control,
    name: `nodes[${index}].newConceptDetails.preferredTerm` as 'nodes.0.newConceptDetails.preferredTerm',
  });

  return <span>{fsnToggle ? fsn : pt}</span>;
}
