import { describe, expect, it } from 'vitest';
import { applyBrandRename, LastBrands } from './brandRenameHelper.ts';

function makeProduct(conceptId: string, term: string, bpn: string) {
  return {
    productDetails: {
      productName: { conceptId, pt: { term } },
      brandedProductName: bpn,
    },
  };
}

function makeProductNoBrand(bpn: string) {
  return {
    productDetails: {
      brandedProductName: bpn,
    },
  };
}

describe('applyBrandRename', () => {
  // ── existing cases adapted to new signature ──────────────────────────────

  it('replaces old brand term in brandedProductName when the concept changes', () => {
    const prev = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct('222', 'BetaBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'BetaBrand 5 mg tablet',
    );
  });

  it('replaces all occurrences (global replace)', () => {
    const prev = {
      containedProducts: [makeProduct('111', 'Foo', 'Foo Foo 10 mg')],
    };
    const next = {
      containedProducts: [makeProduct('222', 'Bar', 'Foo Foo 10 mg')],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'Bar Bar 10 mg',
    );
  });

  it('leaves the section unchanged when the brand concept is the same', () => {
    const prev = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    expect(result).toBe(next); // exact same reference — nothing changed
  });

  it('leaves the section unchanged when old term is not present in brandedProductName', () => {
    const prev = {
      containedProducts: [
        makeProduct('111', 'OldBrand', 'Something else 5 mg'),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct('222', 'NewBrand', 'Something else 5 mg'),
      ],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    expect(result).toBe(next);
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'Something else 5 mg',
    );
  });

  it('handles missing containedProducts on either side gracefully', () => {
    const lastBrands: LastBrands = {};
    const result = applyBrandRename({}, { someOtherField: 1 }, lastBrands);
    expect(result).toEqual({ someOtherField: 1 });
  });

  // ── new cases ─────────────────────────────────────────────────────────────

  it('clear→set: replaces correctly across two calls sharing lastBrands', () => {
    // Call 1: clear event — prevBrand is old brand, nextBrand is empty
    const clearPrev = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const clearNext = {
      containedProducts: [makeProductNoBrand('AcmeBrand 5 mg tablet')],
    };
    const lastBrands: LastBrands = {};
    const afterClear = applyBrandRename(clearPrev, clearNext, lastBrands);

    // lastBrands[0] should now be seeded with the old brand from clearPrev
    expect(lastBrands[0]).toEqual({ conceptId: '111', term: 'AcmeBrand' });
    // Nothing to replace yet — nextBrand is empty
    expect(afterClear).toBe(clearNext);

    // Call 2: set event — prevBrand is still empty (from clearNext), nextBrand is new brand
    const setPrev = clearNext; // the form state after clear
    const setNext = {
      containedProducts: [
        makeProduct('222', 'BetaBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const afterSet = applyBrandRename(setPrev, setNext, lastBrands);

    // Should have replaced old brand with new brand using lastBrands seed
    expect(
      afterSet.containedProducts[0].productDetails.brandedProductName,
    ).toBe('BetaBrand 5 mg tablet');
    // lastBrands[0] updated to new brand
    expect(lastBrands[0]).toEqual({ conceptId: '222', term: 'BetaBrand' });
  });

  it('clear→set no-match: lastBrands updates even when bpn has no brand token', () => {
    // bpn does NOT contain the old brand term, so no replacement is possible.
    // The important invariant: lastBrands[0] is still seeded/updated on both calls
    // so future swaps can look up the current brand correctly.

    // Call 1 (clear): brand goes from Acme → empty; bpn has no "Acme" token.
    const clearPrev = makeProduct('111', 'Acme', 'Something 5 mg');
    const clearNext = makeProductNoBrand('Something 5 mg');
    const lastBrands: LastBrands = {};
    const afterClear = applyBrandRename(
      { containedProducts: [clearPrev] },
      { containedProducts: [clearNext] },
      lastBrands,
    );

    // lastBrands[0] seeded from clearPrev's brand
    expect(lastBrands[0]).toEqual({ conceptId: '111', term: 'Acme' });
    // Nothing replaced — next returned unchanged (same ref)
    expect(afterClear).toEqual({ containedProducts: [clearNext] });

    // Call 2 (set): brand goes from empty → Beta; still no match in bpn.
    const setNext = {
      containedProducts: [makeProduct('222', 'Beta', 'Something 5 mg')],
    };
    const afterSet = applyBrandRename(
      { containedProducts: [clearNext] },
      setNext,
      lastBrands,
    );

    // bpn unchanged — "Something 5 mg" contains neither "Acme" nor "Beta"
    expect(
      afterSet.containedProducts[0].productDetails.brandedProductName,
    ).toBe('Something 5 mg');
    // lastBrands[0] updated to the new brand despite no replacement
    expect(lastBrands[0]).toEqual({ conceptId: '222', term: 'Beta' });
  });

  it('strip-retry: replaces when old/new terms carry trailing parens not in bpn', () => {
    // Term is "Ongentys (brand)" but bpn only contains "Ongentys"
    const prev = {
      containedProducts: [
        makeProduct('111', 'Ongentys (brand)', 'Ongentys 50 mg capsule'),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct('222', 'Newgentys (brand)', 'Ongentys 50 mg capsule'),
      ],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    // Verbatim "Ongentys (brand)" not in bpn; stripped "Ongentys" IS → replace with "Newgentys"
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'Newgentys 50 mg capsule',
    );
  });

  it('strip-retry: no match even after strip → unchanged', () => {
    const prev = {
      containedProducts: [
        makeProduct(
          '111',
          'NoMatch (brand)',
          'Something completely different 5 mg',
        ),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct(
          '222',
          'Other (brand)',
          'Something completely different 5 mg',
        ),
      ],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    expect(result).toBe(next);
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'Something completely different 5 mg',
    );
  });

  it('same conceptId reselected → no-op', () => {
    const prev = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const lastBrands: LastBrands = {
      0: { conceptId: '111', term: 'AcmeBrand' },
    };
    const result = applyBrandRename(prev, next, lastBrands);
    expect(result).toBe(next);
  });

  it('immutability: prev and next are not mutated', () => {
    const prev = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct('222', 'BetaBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const originalPrevBpn =
      prev.containedProducts[0].productDetails.brandedProductName;
    const originalNextBpn =
      next.containedProducts[0].productDetails.brandedProductName;
    const lastBrands: LastBrands = {};

    applyBrandRename(prev, next, lastBrands);

    expect(prev.containedProducts[0].productDetails.brandedProductName).toBe(
      originalPrevBpn,
    );
    expect(next.containedProducts[0].productDetails.brandedProductName).toBe(
      originalNextBpn,
    );
  });

  it('returns next unchanged when containedProducts are absent on next', () => {
    const prev = {
      containedProducts: [makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg')],
    };
    const next = { productName: 'something' };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    expect(result).toBe(next);
  });

  it('trim-down: matches the longest leading-word prefix when the brand is woven into the AMP', () => {
    const bpn =
      'Benzylpenicillin Benzathine Brancaster 2.4 million units powder for suspension for injection vial ULM';
    const prev = {
      containedProducts: [
        makeProduct(
          '111',
          'Benzylpenicillin Benzathine Brancaster ULM (brand)',
          bpn,
        ),
      ],
    };
    const next = {
      containedProducts: [makeProduct('222', 'Accofil (brand)', bpn)],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    // Full term and "...Brancaster ULM" are not contiguous; the longest matching
    // leading prefix is "Benzylpenicillin Benzathine Brancaster" → replaced with
    // "Accofil". The trailing old "ULM" lingers (best-effort; author trims).
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'Accofil 2.4 million units powder for suspension for injection vial ULM',
    );
  });

  it('trim-down: falls back to a single leading word when only that matches', () => {
    const prev = {
      containedProducts: [
        makeProduct('111', 'Foo Bar (brand)', 'Foo 50 mg tablet'),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct('222', 'Zed (brand)', 'Foo 50 mg tablet'),
      ],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    // "Foo Bar" not present; trims to the single word "Foo" → replaced with "Zed".
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'Zed 50 mg tablet',
    );
  });

  // ── FIX 3: containedProducts length change clears lastBrands ──────────────

  it('FIX 3: product removal clears lastBrands and returns next unchanged', () => {
    const prev = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
        makeProduct('222', 'BetaBrand', 'BetaBrand 10 mg tablet'),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct('333', 'GammaBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const lastBrands: LastBrands = {
      0: { conceptId: '111', term: 'AcmeBrand' },
      1: { conceptId: '222', term: 'BetaBrand' },
    };
    const result = applyBrandRename(prev, next, lastBrands);
    // lastBrands should be cleared because section count changed
    expect(Object.keys(lastBrands)).toHaveLength(0);
    // result should be next unchanged (same reference)
    expect(result).toBe(next);
    // brandedProductName in the surviving section must NOT be modified
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'AcmeBrand 5 mg tablet',
    );
  });

  it('FIX 3: product addition clears lastBrands and returns next unchanged', () => {
    const prev = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
      ],
    };
    const next = {
      containedProducts: [
        makeProduct('111', 'AcmeBrand', 'AcmeBrand 5 mg tablet'),
        makeProductNoBrand(''),
      ],
    };
    const lastBrands: LastBrands = {
      0: { conceptId: '111', term: 'AcmeBrand' },
    };
    const result = applyBrandRename(prev, next, lastBrands);
    expect(Object.keys(lastBrands)).toHaveLength(0);
    expect(result).toBe(next);
  });

  // ── FIX 4: single-word trim-down safety guard ─────────────────────────────

  it('FIX 4: multi-word brand trimmed to single word that appears MULTIPLE times → not replaced', () => {
    // Brand is "Acme Pharma" (multi-word, no parens). The verbatim match fails because
    // "Acme Pharma" is not contiguous in the bpn (the brand's leading words are split by
    // other content). Only "Acme" (single leading word) is present, but it appears twice
    // in the bpn, so the guard skips it and bpn is returned unchanged.
    const bpn = 'Acme 5 mg Acme tablet';
    const prev = {
      containedProducts: [makeProduct('111', 'Acme Pharma', bpn)],
    };
    const next = {
      containedProducts: [makeProduct('222', 'NewBrand', bpn)],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    // "Acme Pharma" not present verbatim; stripped (no parens) → "Acme Pharma".
    // Tries "Acme Pharma" → not in bpn. Tries "Acme" → in bpn but appears 2 times → skip.
    // No match → result is next unchanged.
    expect(result).toBe(next);
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      bpn,
    );
  });

  it('FIX 4: multi-word brand trimmed to single word that appears EXACTLY ONCE → replaced', () => {
    // "Foo" appears only once in bpn. Brand is "Foo Bar" (multi-word), only single word
    // "Foo" matches, and it occurs exactly once → replacement is allowed.
    const bpn = 'Foo 5 mg tablet';
    const prev = {
      containedProducts: [makeProduct('111', 'Foo Bar', bpn)],
    };
    const next = {
      containedProducts: [makeProduct('222', 'Zed', bpn)],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'Zed 5 mg tablet',
    );
  });

  it('FIX 4: genuinely single-word brand uses existing global replace (unrestricted)', () => {
    // Brand is "Foo" (only one word), so the words.length === 1 path handles it via
    // the verbatim check and the loop with k===1 && words.length===1 → no guard applied.
    const bpn = 'Foo Foo 10 mg';
    const prev = {
      containedProducts: [makeProduct('111', 'Foo', bpn)],
    };
    const next = {
      containedProducts: [makeProduct('222', 'Bar', bpn)],
    };
    const lastBrands: LastBrands = {};
    const result = applyBrandRename(prev, next, lastBrands);
    // Both occurrences replaced (global replace for single-word brands).
    expect(result.containedProducts[0].productDetails.brandedProductName).toBe(
      'Bar Bar 10 mg',
    );
  });
});
