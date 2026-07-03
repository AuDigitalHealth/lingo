import { describe, expect, it } from 'vitest';
import { shouldSeedBrandedProductName } from './BrandedProductNameWidget.tsx';

const base = {
  isTargetSection: true,
  prefillStatus: 'suggested' as const,
  prefillValue: 'Anxicalm 5 mg Tablets',
  currentValue: '',
  userEdited: false,
};

describe('shouldSeedBrandedProductName', () => {
  it('seeds an empty target field from a suggestion', () => {
    expect(shouldSeedBrandedProductName(base)).toBe(true);
  });

  it('keeps seeding while the field is empty and untouched (survives a load that blanks it)', () => {
    // Race resilience (IEDC-7474): a product-load write can leave the field empty again; because
    // the decision is stateless and only gated on empty + not-user-edited, the widget re-seeds.
    expect(shouldSeedBrandedProductName({ ...base, currentValue: '' })).toBe(
      true,
    );
  });

  it('does not seed once the field holds a value', () => {
    expect(
      shouldSeedBrandedProductName({
        ...base,
        currentValue: 'Anxicalm 5 mg Tablets',
      }),
    ).toBe(false);
  });

  it('does not seed once the user has taken over the field', () => {
    expect(shouldSeedBrandedProductName({ ...base, userEdited: true })).toBe(
      false,
    );
  });

  it('does not seed a widget outside the prefilled section', () => {
    expect(
      shouldSeedBrandedProductName({ ...base, isTargetSection: false }),
    ).toBe(false);
  });

  it('does not seed when there is no suggestion', () => {
    expect(
      shouldSeedBrandedProductName({
        ...base,
        prefillStatus: 'empty',
        prefillValue: undefined,
      }),
    ).toBe(false);
  });
});
