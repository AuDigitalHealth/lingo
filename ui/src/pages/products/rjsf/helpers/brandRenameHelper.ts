/**
 * applyBrandRename — cross-field UX helper.
 *
 * When an author swaps the Brand Name (productName concept) inside a contained-
 * product section, automatically find-and-replace the old brand's preferred term
 * with the new one inside the same section's brandedProductName string, so the
 * author does not have to retype the AMP name after a brand swap.
 *
 * The brand autocomplete fires TWO change events when swapping: first it clears
 * productName (newId undefined), then sets the new concept. Comparing only
 * adjacent prev/next therefore never sees the real old and new brands together.
 * `lastBrands` is a mutable record (keyed by containedProducts index) that the
 * caller owns via useRef; it remembers the last non-empty brand per section
 * across events so the rename can always compare old→new correctly.
 *
 * Pure / immutable with respect to `prev` and `next`: never mutates either.
 * Only mutates the `lastBrands` record, which is the caller's ref.
 * Returns `next` unchanged (same ref) when there is nothing to do.
 */

export type LastBrands = Record<number, { conceptId: string; term: string }>;

/**
 * Strip a trailing parenthetical like " (brand)" from a term.
 * e.g. "Ongentys (brand)" → "Ongentys"
 */
function stripTrailingParen(s: string): string {
  return s.replace(/\s*\([^()]*\)\s*$/, '').trim();
}

/**
 * Replace occurrences of the old brand with the new brand inside `bpn` (the
 * branded product name), best-effort:
 *  1. Try the full `oldTerm` verbatim.
 *  2. Otherwise strip a trailing parenthetical (e.g. " (brand)") from both
 *     terms, then match the longest *leading-word prefix* of the stripped old
 *     term that is a contiguous substring of `bpn`, trimming one trailing word
 *     at a time down to a single word. NMPC brand names are woven into the AMP
 *     name (leading brand words at the front, trailing words like "ULM" at the
 *     end with strength/form wedged between), so the leading prefix is usually
 *     what's present contiguously. The matched phrase is replaced with the
 *     stripped new term. Case-sensitive (brand tokens are capitalised) to
 *     reduce matching generic lower-case words.
 * Returns `bpn` unchanged if nothing matches. Author reviews the result, so a
 * lingering trailing word (e.g. the old "ULM") or an over-eager single-word
 * match is acceptable best-effort.
 */
function replaceBrand(bpn: string, oldTerm: string, newTerm: string): string {
  if (bpn.includes(oldTerm)) {
    return bpn.split(oldTerm).join(newTerm);
  }

  const oldStripped = stripTrailingParen(oldTerm);
  const newStripped = stripTrailingParen(newTerm);
  const words = oldStripped.split(/\s+/).filter(Boolean);

  // Longest leading-word prefix first, trimming trailing words down to one.
  for (let k = words.length; k >= 1; k--) {
    const candidate = words.slice(0, k).join(' ');
    if (candidate && bpn.includes(candidate)) {
      // Safety guard: when the matched candidate is the single leading word of a
      // multi-word brand (k === 1 && words.length > 1), only replace if that word
      // appears exactly once in bpn. A common word appearing multiple times could
      // corrupt unrelated parts of the name.
      if (k === 1 && words.length > 1) {
        if (bpn.split(candidate).length - 1 !== 1) {
          continue;
        }
      }
      return bpn.split(candidate).join(newStripped);
    }
  }

  return bpn;
}

export function applyBrandRename(
  prev: any,
  next: any,
  lastBrands: LastBrands,
): any {
  const nextProducts: any[] | undefined = next?.containedProducts;

  if (!Array.isArray(nextProducts)) {
    return next;
  }

  // If the number of contained products changed (add or remove), the index→brand
  // mapping is stale. Clear lastBrands so the seed logic re-captures fresh brands
  // on the next change, and return next unchanged for this cycle.
  const prevProducts: any[] | undefined = prev?.containedProducts;
  if (
    Array.isArray(prevProducts) &&
    prevProducts.length !== nextProducts.length
  ) {
    Object.keys(lastBrands).forEach(k => delete lastBrands[Number(k)]);
    return next;
  }

  let changed = false;
  const newProducts = nextProducts.map((nextProduct, i) => {
    const prevBrand = prev?.containedProducts?.[i]?.productDetails?.productName;
    const nextBrand = nextProduct?.productDetails?.productName;
    const bpn: string | undefined =
      nextProduct?.productDetails?.brandedProductName;

    // SEED: if lastBrands[i] is unset and prevBrand has a valid concept, capture
    // it now (this runs on the "clear" event where prevBrand is still the old
    // brand and nextBrand is about to become undefined).
    if (
      lastBrands[i] === undefined &&
      prevBrand?.conceptId &&
      prevBrand?.pt?.term
    ) {
      lastBrands[i] = {
        conceptId: prevBrand.conceptId,
        term: prevBrand.pt.term,
      };
    }

    if (nextBrand?.conceptId && nextBrand?.pt?.term) {
      const oldB = lastBrands[i];

      if (oldB && oldB.conceptId !== nextBrand.conceptId && bpn) {
        const replaced = replaceBrand(bpn, oldB.term, nextBrand.pt.term);
        if (replaced !== bpn) {
          changed = true;
          // Update lastBrands to the new brand before returning the mutated product.
          lastBrands[i] = {
            conceptId: nextBrand.conceptId,
            term: nextBrand.pt.term,
          };
          return {
            ...nextProduct,
            productDetails: {
              ...nextProduct.productDetails,
              brandedProductName: replaced,
            },
          };
        }
      }

      // Whether or not a replacement happened, update lastBrands to current brand.
      lastBrands[i] = {
        conceptId: nextBrand.conceptId,
        term: nextBrand.pt.term,
      };
    }
    // If nextBrand is empty/cleared, leave lastBrands[i] as-is so the seed
    // is still available for the upcoming set event.

    return nextProduct;
  });

  if (!changed) {
    return next;
  }

  return {
    ...next,
    containedProducts: newProducts,
  };
}
