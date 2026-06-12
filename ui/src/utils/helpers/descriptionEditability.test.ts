import { describe, expect, it } from 'vitest';
import {
  isAcceptabilityReadOnly,
  isActiveToggleDisabled,
  isDescriptionContentReadOnly,
  isInternationalModule,
} from './conceptUtils';
import { Description } from '../../types/concept';
import { LanguageRefset } from '../../types/Project';

const INT_CORE = '900000000000207008';
const INT_METADATA = '900000000000012004';
const OWN_MODULE = '32506021000036107'; // AU extension
const HISTORICAL_OWN = '351000168100'; // historical AU extension module

function desc(overrides: Partial<Description>): Description {
  return {
    active: true,
    moduleId: OWN_MODULE,
    released: true,
    term: 'a term',
    typeId: '900000000000013009',
    type: 'SYNONYM' as Description['type'],
    lang: 'en',
    caseSignificance: 'CASE_INSENSITIVE' as Description['caseSignificance'],
    ...overrides,
  };
}

describe('isInternationalModule', () => {
  it('is true for the International core and metadata modules', () => {
    expect(isInternationalModule(INT_CORE)).toBe(true);
    expect(isInternationalModule(INT_METADATA)).toBe(true);
  });

  it('is false for extension modules, including historical ones', () => {
    expect(isInternationalModule(OWN_MODULE)).toBe(false);
    expect(isInternationalModule(HISTORICAL_OWN)).toBe(false);
  });

  it('is false for a missing module (new, unsaved description)', () => {
    expect(isInternationalModule(undefined)).toBe(false);
    expect(isInternationalModule(null)).toBe(false);
    expect(isInternationalModule('')).toBe(false);
  });
});

describe('isDescriptionContentReadOnly', () => {
  it('locks term text for International-module descriptions', () => {
    expect(
      isDescriptionContentReadOnly(desc({ moduleId: INT_CORE }), false, true),
    ).toBe(true);
    expect(
      isDescriptionContentReadOnly(
        desc({ moduleId: INT_METADATA }),
        false,
        true,
      ),
    ).toBe(true);
  });

  it('leaves own-module descriptions editable, even historical modules', () => {
    expect(
      isDescriptionContentReadOnly(desc({ moduleId: OWN_MODULE }), false, true),
    ).toBe(false);
    expect(
      isDescriptionContentReadOnly(
        desc({ moduleId: HISTORICAL_OWN }),
        false,
        true,
      ),
    ).toBe(false);
  });

  it('leaves a new (no module) description editable', () => {
    expect(
      isDescriptionContentReadOnly(desc({ moduleId: undefined }), false, true),
    ).toBe(false);
  });

  it('locks when the modal is disabled or the row is inactive', () => {
    expect(
      isDescriptionContentReadOnly(desc({ moduleId: OWN_MODULE }), true, true),
    ).toBe(true);
    expect(
      isDescriptionContentReadOnly(
        desc({ moduleId: OWN_MODULE }),
        false,
        false,
      ),
    ).toBe(true);
  });
});

describe('isActiveToggleDisabled', () => {
  it('blocks inactivating an active International description', () => {
    expect(
      isActiveToggleDisabled(desc({ moduleId: INT_CORE, active: true }), false),
    ).toBe(true);
  });

  it('allows reactivating an inactive International description', () => {
    expect(
      isActiveToggleDisabled(
        desc({ moduleId: INT_CORE, active: false }),
        false,
      ),
    ).toBe(false);
  });

  it('allows toggling own-module descriptions in both states', () => {
    expect(
      isActiveToggleDisabled(
        desc({ moduleId: OWN_MODULE, active: true }),
        false,
      ),
    ).toBe(false);
    expect(
      isActiveToggleDisabled(
        desc({ moduleId: OWN_MODULE, active: false }),
        false,
      ),
    ).toBe(false);
  });

  it('is disabled whenever the modal is disabled', () => {
    expect(
      isActiveToggleDisabled(
        desc({ moduleId: OWN_MODULE, active: false }),
        true,
      ),
    ).toBe(true);
  });
});

describe('isAcceptabilityReadOnly', () => {
  const usRefset = (readOnly?: string): LanguageRefset => ({
    default: 'false',
    en: '900000000000509007',
    dialectName: 'US',
    readOnly,
  });
  const gbRefset: LanguageRefset = {
    default: 'false',
    en: '900000000000508004',
    dialectName: 'GB',
    readOnly: 'false',
  };
  const defaultRefset: LanguageRefset = {
    default: 'true',
    en: '21000220103',
    dialectName: 'IE',
    readOnly: 'false',
  };

  it('honours Snowstorm read-only flag regardless of module', () => {
    expect(
      isAcceptabilityReadOnly(
        usRefset('true'),
        desc({ moduleId: OWN_MODULE }),
        false,
      ),
    ).toBe(true);
  });

  it('locks GB English everywhere (never authored by the extension)', () => {
    expect(
      isAcceptabilityReadOnly(gbRefset, desc({ moduleId: OWN_MODULE }), false),
    ).toBe(true);
    expect(
      isAcceptabilityReadOnly(gbRefset, desc({ moduleId: INT_CORE }), false),
    ).toBe(true);
  });

  it('locks non-default dialects (e.g. US) on International descriptions', () => {
    expect(
      isAcceptabilityReadOnly(
        usRefset('false'),
        desc({ moduleId: INT_CORE }),
        false,
      ),
    ).toBe(true);
  });

  it('allows non-default dialects on the extension own-module descriptions', () => {
    expect(
      isAcceptabilityReadOnly(
        usRefset('false'),
        desc({ moduleId: OWN_MODULE }),
        false,
      ),
    ).toBe(false);
  });

  it('keeps the default dialect editable even on an International description', () => {
    expect(
      isAcceptabilityReadOnly(
        defaultRefset,
        desc({ moduleId: INT_CORE }),
        false,
      ),
    ).toBe(false);
  });

  it('is read-only whenever the modal is disabled', () => {
    expect(
      isAcceptabilityReadOnly(
        usRefset('false'),
        desc({ moduleId: OWN_MODULE }),
        true,
      ),
    ).toBe(true);
  });
});
