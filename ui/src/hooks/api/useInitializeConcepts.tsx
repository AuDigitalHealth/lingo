import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import useConceptStore from '../../stores/ConceptStore.ts';
import ConceptService from '../../api/ConceptService.ts';

export default function useInitializeConcepts() {
  const { unitsIsLoading } = useInitializeUnits();
  const { containerTypesIsLoading } = useInitializeContainerTypes();
  const { brandProductsIsLoading } = useInitializeBrandProducts();
  const { ingredientsIsLoading } = useInitializeIngredients();
  const { doseFormsIsLoading } = useInitializeDoseForms();

  return {
    conceptsLoading:
      unitsIsLoading ||
      containerTypesIsLoading ||
      brandProductsIsLoading ||
      ingredientsIsLoading ||
      doseFormsIsLoading,
  };
}

export function useInitializeUnits() {
  const { setUnits } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['units'],
    () => ConceptService.getAllUnits(),
    { staleTime: 1 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setUnits(data);
    }
  }, [data, setUnits]);

  const unitsIsLoading: boolean = isLoading;
  const unitsData = data;

  return { unitsIsLoading, unitsData };
}
export function useInitializeContainerTypes() {
  const { setContainerTypes } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['containerTypes'],
    () => ConceptService.getAllContainerTypes(),
    { staleTime: 1 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setContainerTypes(data);
    }
  }, [data, setContainerTypes]);

  const containerTypesIsLoading: boolean = isLoading;
  const containerTypes = data;

  return { containerTypesIsLoading, containerTypes };
}
export function useInitializeBrandProducts() {
  const { setBrandProducts } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['brandProducts'],
    () => ConceptService.getAllBrandProducts(),
    { staleTime: 1 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setBrandProducts(data);
    }
  }, [data, setBrandProducts]);

  const brandProductsIsLoading: boolean = isLoading;
  const brandProducts = data;

  return { brandProductsIsLoading, brandProducts };
}
export function useInitializeIngredients() {
  const { setIngredients } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['ingredients'],
    () => ConceptService.getAllIngredients(),
    { staleTime: 1 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setIngredients(data);
    }
  }, [data, setIngredients]);

  const ingredientsIsLoading: boolean = isLoading;
  const ingredients = data;

  return { ingredientsIsLoading, ingredients };
}
export function useInitializeDoseForms() {
  const { setDoseForms } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['doseForms'],
    () => ConceptService.getAllDoseForms(),
    { staleTime: 1 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setDoseForms(data);
    }
  }, [data, setDoseForms]);

  const doseFormsIsLoading: boolean = isLoading;
  const doseForms = data;

  return { doseFormsIsLoading, doseForms };
}
