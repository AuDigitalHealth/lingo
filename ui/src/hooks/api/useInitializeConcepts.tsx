import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import useConceptStore from '../../stores/ConceptStore.ts';
import ConceptService from '../../api/ConceptService.ts';
import { ConceptSearchType } from '../../types/conceptSearch.ts';
import { getECLForSearch } from '../../utils/helpers/conceptUtils.ts';
import { Concept } from '../../types/concept.ts';

export default function useInitializeConcepts() {
  const { unitsIsLoading } = useInitializeUnits();
  const { containerTypesIsLoading } = useInitializeContainerTypes();
  const { brandProductsIsLoading } = useInitializeBrandProducts();
  const { ingredientsIsLoading } = useInitializeIngredients();
  const { doseFormsIsLoading } = useInitializeDoseForms();
  const { deviceBrandProductIsLoading } = useInitializeDeviceBrandProducts();
  const { deviceDeviceTypeIsLoading } = useInitializeDeviceDeviceTypes();
  const { medicationDeviceTypeIsLoading } =
    useInitializeMedicationDeviceTypes();

  return {
    conceptsLoading:
      unitsIsLoading ||
      containerTypesIsLoading ||
      brandProductsIsLoading ||
      ingredientsIsLoading ||
      doseFormsIsLoading ||
      deviceBrandProductIsLoading ||
      deviceDeviceTypeIsLoading ||
      medicationDeviceTypeIsLoading,
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
    () => ConceptService.getMedicationBrandProducts(),
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

export function useInitializeDeviceBrandProducts() {
  const { setDeviceBrandProducts } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['deviceBrandProducts'],
    () => ConceptService.getDeviceBrandProducts(),
    { staleTime: 1 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setDeviceBrandProducts(data);
    }
  }, [data, setDeviceBrandProducts]);

  const deviceBrandProductIsLoading: boolean = isLoading;
  const deviceBrandProducts = data;

  return { deviceBrandProductIsLoading, deviceBrandProducts };
}

export function useInitializeDeviceDeviceTypes() {
  const { setDeviceDeviceTypes } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['deviceTypes'],
    () => ConceptService.getDeviceDeviceTypes(),
    { staleTime: 1 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setDeviceDeviceTypes(data);
    }
  }, [data, setDeviceDeviceTypes]);

  const deviceDeviceTypeIsLoading: boolean = isLoading;
  const deviceDeviceTypes = data;

  return { deviceDeviceTypeIsLoading, deviceDeviceTypes };
}

export function useInitializeMedicationDeviceTypes() {
  const { setMedicationDeviceTypes } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['MedicationDeviceTypes'],
    () => ConceptService.getMedicationDeviceTypes(),
    { staleTime: 1 * (60 * 1000) },
  );
  useMemo(() => {
    if (data) {
      setMedicationDeviceTypes(data);
    }
  }, [data, setMedicationDeviceTypes]);

  const medicationDeviceTypeIsLoading: boolean = isLoading;
  const medicationDeviceTypes = data;

  return { medicationDeviceTypeIsLoading, medicationDeviceTypes };
}

export function useSearchConcepts(
  searchString: string,
  searchType: ConceptSearchType,
  concept?: Concept,
  ecl?: string,
) {
  const eclSearch = ecl ? ecl : getECLForSearch(searchType);

  const { isLoading, data } = useQuery(
    [`search-products-${searchType}-${searchString}`],
    () => {
      if (concept && concept.conceptId) {
        return ConceptService.searchConceptById(concept.conceptId);
      }

      return ConceptService.searchConcept(searchString, eclSearch);
    },
    {
      staleTime: 0.5 * (60 * 1000),
      enabled: searchString !== undefined && searchString.length > 2,
    },
  );

  return { isLoading, data };
}
export function useSpecialDoseFormSearch(
  searchString: string,
  ecl: string | undefined,
) {
  const { isLoading, data } = useQuery(
    [`search-products-special-dose-${searchString}`],
    () => {
      // if(searchString.length > 2 && eclSearch && eclSearch.length >0)
      return ConceptService.searchConcept(searchString, ecl);
    },
    {
      staleTime: 0.5 * (60 * 1000),
      enabled:
        ecl !== undefined &&
        searchString !== undefined &&
        searchString.length > 2,
    },
  );

  return { isLoading, data };
}
