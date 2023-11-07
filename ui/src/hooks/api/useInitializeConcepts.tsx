import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import useConceptStore from '../../stores/ConceptStore.ts';
import ConceptService from '../../api/ConceptService.ts';
import { ConceptSearchType } from '../../types/conceptSearch.ts';
import { getECLForSearch } from '../../utils/helpers/conceptUtils.ts';
import { Concept } from '../../types/concept.ts';

export default function useInitializeConcepts(branch: string) {
  const { unitsIsLoading } = useInitializeUnits(branch);
  const { containerTypesIsLoading } = useInitializeContainerTypes(branch);
  const { brandProductsIsLoading } = useInitializeBrandProducts(branch);
  const { ingredientsIsLoading } = useInitializeIngredients(branch);
  const { doseFormsIsLoading } = useInitializeDoseForms(branch);
  const { deviceBrandProductIsLoading } =
    useInitializeDeviceBrandProducts(branch);
  const { deviceDeviceTypeIsLoading } = useInitializeDeviceDeviceTypes(branch);
  const { medicationDeviceTypeIsLoading } =
    useInitializeMedicationDeviceTypes(branch);

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

export function useInitializeUnits(branch: string) {
  const { setUnits } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['units'],
    () => ConceptService.getAllUnits(branch),
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
export function useInitializeContainerTypes(branch: string) {
  const { setContainerTypes } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['containerTypes'],
    () => ConceptService.getAllContainerTypes(branch),
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
export function useInitializeBrandProducts(branch: string) {
  const { setBrandProducts } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['brandProducts'],
    () => ConceptService.getMedicationBrandProducts(branch),
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
export function useInitializeIngredients(branch: string) {
  const { setIngredients } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['ingredients'],
    () => ConceptService.getAllIngredients(branch),
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
export function useInitializeDoseForms(branch: string) {
  const { setDoseForms } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['doseForms'],
    () => ConceptService.getAllDoseForms(branch),
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

export function useInitializeDeviceBrandProducts(branch: string) {
  const { setDeviceBrandProducts } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['deviceBrandProducts'],
    () => ConceptService.getDeviceBrandProducts(branch),
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

export function useInitializeDeviceDeviceTypes(branch: string) {
  const { setDeviceDeviceTypes } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['deviceTypes'],
    () => ConceptService.getDeviceDeviceTypes(branch),
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

export function useInitializeMedicationDeviceTypes(branch: string) {
  const { setMedicationDeviceTypes } = useConceptStore();
  const { isLoading, data } = useQuery(
    ['MedicationDeviceTypes'],
    () => ConceptService.getMedicationDeviceTypes(branch),
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
  branch: string,
  concept?: Concept,
  ecl?: string,
) {
  const eclSearch = ecl ? ecl : getECLForSearch(searchType);

  const { isLoading, data } = useQuery(
    [`search-products-${searchType}-${searchString}`],
    () => {
      if (concept && concept.conceptId) {
        return ConceptService.searchConceptById(concept.conceptId, branch);
      }

      return ConceptService.searchConcept(searchString, branch, eclSearch);
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
  branch: string,
) {
  const { isLoading, data } = useQuery(
    [`search-products-special-dose-${searchString}`],
    () => {
      // if(searchString.length > 2 && eclSearch && eclSearch.length >0)
      return ConceptService.searchConcept(searchString, branch, ecl);
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
