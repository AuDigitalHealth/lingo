import {Product, ProductSummary} from '../../../types/concept.ts';
import {
  Control,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import React from 'react';
import {FieldBindings} from '../../../types/FieldBindings.ts';
import {RefsetMember} from '../../../types/RefsetMember.ts';
import {AccordionDetails, AccordionSummary, Grid, Typography,} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {isFsnToggleOn, OWL_EXPRESSION_ID,} from '../../../utils/helpers/conceptUtils.ts';
import ProductPreviewPanel from './ProductPreviewPanel.tsx';
import {ProductPreviewAccordion} from './ProductPreviewAccordion.tsx';
import {Ticket} from '../../../types/tickets/ticket.ts';

interface ProductTypeGroupPreviewProps {
  productLabelItems: Product[];
  label: string;
  control: Control<ProductSummary>;
  productModel: ProductSummary;
  activeConcept: string | undefined;
  expandedConcepts: string[];
  setExpandedConcepts: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveConcept: React.Dispatch<React.SetStateAction<string | undefined>>;
  register: UseFormRegister<ProductSummary>;
  watch: UseFormWatch<ProductSummary>;
  getValues: UseFormGetValues<ProductSummary>;
  idsWithInvalidName: string[];
  setIdsWithInvalidName: (value: string[]) => void;
  fieldBindings: FieldBindings;
  branch: string;
  refsetData: RefsetMember[] | undefined;
  editProduct: boolean;
  setValue: UseFormSetValue<ProductSummary>;
  ticket?: Ticket;
}

function ProductTypeGroupPreview({
  productLabelItems,
  label,
  control,
  productModel,
  activeConcept,
  setActiveConcept,
  expandedConcepts,
  setExpandedConcepts,
  register,
  getValues,
  idsWithInvalidName,
  setIdsWithInvalidName,
  fieldBindings,
  branch,
  refsetData,
  editProduct,
  setValue,
  ticket,
}: ProductTypeGroupPreviewProps) {

  return (
    <Grid>
      <ProductPreviewAccordion
        defaultExpanded={true}
        data-testid={`product-group-${label}`}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography data-testid={`product-group-title-${label}`}>
            {productLabelItems[0]?.displayName}
          </Typography>
        </AccordionSummary>
        <AccordionDetails key={label + '-accordion'}>
          <div key={label + '-lists'}>
            {productLabelItems?.map((p, index) => {
              const productRefSetMembers = p.newConcept
                ? p.newConceptDetails?.referenceSetMembers
                    ?.filter(r => r.refsetId !== OWL_EXPRESSION_ID)
                    .flatMap(r => r) || []
                : refsetData?.filter(
                    r =>
                      r.referencedComponentId === p.conceptId &&
                      r.refsetId !== OWL_EXPRESSION_ID,
                  ) || [];
              return (
                <ProductPreviewPanel
                  control={control}
                  fsnToggle={isFsnToggleOn()}
                  productModel={productModel}
                  activeConcept={activeConcept}
                  product={p}
                  expandedConcepts={expandedConcepts}
                  setExpandedConcepts={setExpandedConcepts}
                  setActiveConcept={setActiveConcept}
                  register={register}
                  key={`${p.conceptId}-${index}`}
                  getValues={getValues}
                  idsWithInvalidName={idsWithInvalidName}
                  setIdsWithInvalidName={setIdsWithInvalidName}
                  fieldBindings={fieldBindings}
                  branch={branch}
                  refsetMembers={productRefSetMembers}
                  editProduct={editProduct}
                  setValue={setValue}
                  ticket={ticket}
                />
              );
            })}
          </div>
        </AccordionDetails>
      </ProductPreviewAccordion>
    </Grid>
  );
}
export default ProductTypeGroupPreview;
