import { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BrandedProductNameWidget, {
  BrandedProductNamePrefill,
} from './BrandedProductNameWidget.tsx';

const SUGGESTION = 'Anxicalm 5 mg Tablets';
const SUGGESTED: BrandedProductNamePrefill = {
  status: 'suggested',
  value: SUGGESTION,
  index: 0,
};

// Minimal WidgetProps for the fields the widget actually reads.
function widgetProps(args: {
  value: string | undefined;
  onChange: (v: unknown) => void;
  prefill: BrandedProductNamePrefill;
}) {
  return {
    id: 'root_containedProducts_0_productDetails_brandedProductName',
    value: args.value,
    onChange: args.onChange,
    onBlur: vi.fn(),
    onFocus: vi.fn(),
    rawErrors: [],
    label: 'Branded product name',
    required: false,
    disabled: false,
    readonly: false,
    options: {},
    formContext: { brandedProductNamePrefill: args.prefill },
  } as any;
}

/**
 * Controlled harness mirroring RJSF: the widget's onChange updates the value prop, exactly as
 * the form does. Buttons simulate the writes an authoring component makes:
 * - `blank-field` — a product-load setFormData that overwrites the field to empty (the race that
 *   used to lose the suggestion).
 * - `clear-cycle` — a Clear that blanks the field and resets the prefill to 'none' WITHOUT
 *   remounting the widget (as DeviceAuthoring does — it calls formRef.reset(), not a form key bump).
 * - `new-suggestion` — the ticket suggestion for the next product arriving after a clear.
 */
function Harness({
  initialValue,
  prefill: initialPrefill = SUGGESTED,
}: {
  initialValue: string | undefined;
  prefill?: BrandedProductNamePrefill;
}) {
  const [value, setValue] = useState<string | undefined>(initialValue);
  const [prefill, setPrefill] =
    useState<BrandedProductNamePrefill>(initialPrefill);
  return (
    <>
      <BrandedProductNameWidget
        {...widgetProps({
          value,
          onChange: v => setValue(v as string),
          prefill,
        })}
      />
      <button onClick={() => setValue('')}>blank-field</button>
      <button
        onClick={() => {
          setValue('');
          setPrefill({ status: 'none' });
        }}
      >
        clear-cycle
      </button>
      <button onClick={() => setPrefill(SUGGESTED)}>new-suggestion</button>
    </>
  );
}

const field = () => screen.getByRole('textbox') as HTMLInputElement;

describe('BrandedProductNameWidget prefill seeding (IEDC-7474)', () => {
  it('seeds the empty field from the ticket suggestion', async () => {
    render(<Harness initialValue={undefined} />);
    await waitFor(() => expect(field().value).toBe(SUGGESTION));
  });

  it('does not seed when there is no suggestion', async () => {
    render(
      <Harness
        initialValue={undefined}
        prefill={{ status: 'empty', index: 0 }}
      />,
    );
    // give effects a chance to run, then confirm it stayed empty
    await waitFor(() => expect(field()).toBeTruthy());
    expect(field().value).toBe('');
  });

  it('does not overwrite a value already present', async () => {
    render(<Harness initialValue="Existing branded name" />);
    await waitFor(() => expect(field().value).toBe('Existing branded name'));
  });

  it('re-seeds after a product load blanks the field (race resilience)', async () => {
    render(<Harness initialValue={SUGGESTION} />);
    expect(field().value).toBe(SUGGESTION);
    // A later product-load setFormData blanks the field...
    fireEvent.click(screen.getByRole('button', { name: 'blank-field' }));
    // ...and the widget re-fills it, so the suggestion can't be lost to the race.
    await waitFor(() => expect(field().value).toBe(SUGGESTION));
  });

  it('stops seeding once the user has edited the field', async () => {
    render(<Harness initialValue={undefined} />);
    await waitFor(() => expect(field().value).toBe(SUGGESTION));
    // User takes over and types their own value.
    fireEvent.change(field(), { target: { value: 'My own brand' } });
    expect(field().value).toBe('My own brand');
    // A later load blanks it — the widget must NOT re-seed over the user's intent.
    fireEvent.click(screen.getByRole('button', { name: 'blank-field' }));
    await waitFor(() => expect(field().value).toBe(''));
  });

  it('re-seeds after a blank even when the user focused to review (focus is not an edit)', async () => {
    render(<Harness initialValue={undefined} />);
    await waitFor(() => expect(field().value).toBe(SUGGESTION));
    // User focuses to review the prefilled value (the helper text invites this) but types nothing.
    fireEvent.focus(field());
    // The product-load setFormData then blanks the field...
    fireEvent.click(screen.getByRole('button', { name: 'blank-field' }));
    // ...and the widget still re-fills it: focus alone must not suppress the re-seed (IEDC-7474).
    await waitFor(() => expect(field().value).toBe(SUGGESTION));
  });

  it('re-seeds on a new clear/suggestion cycle after a prior edit (device flow, no remount)', async () => {
    render(<Harness initialValue={undefined} />);
    await waitFor(() => expect(field().value).toBe(SUGGESTION));
    // User edits the field for the current product.
    fireEvent.change(field(), { target: { value: 'My own brand' } });
    expect(field().value).toBe('My own brand');
    // User clicks Clear: DeviceAuthoring blanks the form and resets the prefill to 'none' WITHOUT
    // remounting the widget, so the user-edited guard must be re-armed by the clear itself.
    fireEvent.click(screen.getByRole('button', { name: 'clear-cycle' }));
    await waitFor(() => expect(field().value).toBe(''));
    // The suggestion for the next product arrives — it must seed, not be blocked by the old edit.
    fireEvent.click(screen.getByRole('button', { name: 'new-suggestion' }));
    await waitFor(() => expect(field().value).toBe(SUGGESTION));
  });
});
