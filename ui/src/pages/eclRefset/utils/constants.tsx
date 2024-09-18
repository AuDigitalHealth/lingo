export const SIMPLE_TYPE_REFSET_ECL = '< 446609009';
export const QUERY_REFERENCE_SET = '900000000000513000';
export const TICK_FLICK_REFSET_ECL = `${SIMPLE_TYPE_REFSET_ECL} MINUS ^ ${QUERY_REFERENCE_SET}`;
export const AUSCT = '32506021000036107';
export const AUTPR = '351000168100';

export const ECL_SCOPES = [
  {
    label: 'Clinical Finding hierarchy',
    ecl: '<< 404684003|Clinical finding|',
  },
  {
    label: 'Medication and Substance hierarchies',
    ecl: '<< (373873005|Pharmaceutical / biologic product| OR 105590001|Substance|)',
  },
  {
    label: 'Organism hierarchy',
    ecl: '<< 410607006|Organism|',
  },
  {
    label: 'Procedure hierarchy',
    ecl: '<< 71388002|Procedure|',
  },
];
