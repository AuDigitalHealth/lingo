---

# Detailed Component Analysis

---

## 1. `AutoCompleteField`

### a. Purpose / Overview
Provides an autocomplete input for selecting terminology concepts using an external terminology server (e.g., SNOMED CT), filtered by ECL (Expression Constraint Language).

### b. Rendered Fields / Attributes
- Text input with dropdown suggestions.
- Selected value is stored as an object: `{ conceptId, pt }`.

### c. Layout and Styling
- Minimal styling (inherited from form theme).
- Dropdown list provided by `DropdownSelect`.

### d. Event Handlers
- `onInputChange`: triggers search based on typed characters.
- `onSelect`: sets the selected concept into form data.
- `onBlur`: closes the dropdown.

### e. Validation
- No internal validation.
- Depends on schema for `required` enforcement.

### f. Options (`ui:options`)
- `ecl`: required SNOMED query.
- `extendedEcl`: optional stricter filtering.
- `showDefaultOptions`: whether to load default list on focus.
- `createBrand`: supports creating new entries (`ecl`, `semanticTags`).

### g. Dependencies
- `DropdownSelect`

### h. Potential Improvements
- Add debounce/caching to reduce excessive API calls.
- Validate `createBrand` shape.

---

## 2. `ConditionalArrayField`

### a. Purpose / Overview
A conditional array renderer — only renders if certain conditions are true.

### b. Rendered Fields / Attributes
- Array add/remove controls.
- Nested item rendering with accordion if `arrayTemplate=accordion`.

### c. Layout and Styling
- Conditional rendering block.
- Accordion template uses styled containers.

### d. Event Handlers
- Triggers re-evaluation when dependent field values change.

### e. Validation
- No internal validation.
- May rely on schema validation only if visible.

### f. Options (`ui:options`)
- `conditions`: array of `{ field, operator, value }`.
- `conditionLogic`: `'and'` or `'or'`.
- `arrayTemplate`: e.g., `'accordion'`.
- `skipTitle`: boolean.

### g. Dependencies
- `AccordionArrayTemplate`

### h. Potential Improvements
- Expand logic operators.
- Add real-time debug visibility (why visible or hidden).

---

## 4. `UnitValueUnWrappedField`

### a. Purpose / Overview
Pairs a **unit** and **value** field, shown separately but linked via logic.

### b. Rendered Fields / Attributes
- Numeric input (value).
- Concept picker (unit), using `AutoCompleteField`.

### c. Layout and Styling
- Side-by-side layout with paddings.
- Unit field often styled as dropdown.

### d. Event Handlers
- `onChange` syncs unit-value pairing into the form state.

### e. Validation
- Validates that if value exists, unit must too, and vice versa.

### f. Options (`ui:options`)
- `pairWith`: path to the value field to sync.
- `ecl`, `extendedEcl`, `showDefaultOptions`.

### g. Dependencies
- `UnitInput` (for rendering pair logic).

### h. Potential Improvements
- Merge duplicate logic with `UnitValueField`.

---

## 5. `UnitValueField`

### a. Purpose / Overview
Unified component rendering **value + unit** within a single field schema.

### b. Rendered Fields / Attributes
- Numeric value + unit selector.
- Wrapped inside an object schema.

### c. Layout and Styling
- Stacked layout: value then unit.

### d. Event Handlers
- Sets `{ value, unit }` object in form state.

### e. Validation
- Unit and value must be co-populated.

### f. Options (`ui:options`)
- Configurable for unit ECL filters.
- Can support min/max constraints on value.

### g. Dependencies
- `UnitInput`

### h. Potential Improvements
- Harmonize logic with `UnitValueUnWrappedField`.

---

## 6. `MutuallyExclusiveAutocompleteField`

### a. Purpose / Overview
Displays either of two autocomplete fields (e.g., containerType **or** deviceType), but not both.

### b. Rendered Fields / Attributes
- Field A and Field B (only one shown at a time).

### c. Layout and Styling
- Dynamic show/hide using internal logic.

### d. Event Handlers
- `onChange` in A clears B, and vice versa.

### e. Validation
- Validates that only one is populated.

### f. Options (`ui:options`)
- `fieldAName`, `fieldBName`
- `fieldAOptions`, `fieldBOptions`

### g. Dependencies
- `AutoCompleteField` (used twice)

### h. Potential Improvements
- Add clear UI hint of mutual exclusivity.

---

## 7. `TextFieldWidget`

### a. Purpose / Overview
Custom widget for free-text entry with placeholder and formatting options.

### b. Rendered Fields / Attributes
- Text input.
- Optional placeholder.

### c. Layout and Styling
- Controlled via props or theme styling.

### d. Event Handlers
- Inherits standard RJSF text widget logic.

### e. Validation
- Inline schema-driven validation only.

### f. Options (`ui:options`)
- `placeholder`, `maxLength`, etc.

### g. Dependencies
- None external.

### h. Potential Improvements
- None major; lightweight override.

---

## 8. `OneOfArrayWidget`

### a. Purpose / Overview
Supports multi-valued fields where items must match one of several schema variants.

### b. Rendered Fields / Attributes
- Dropdown to select schema.
- Input fields based on selected schema.

### c. Layout and Styling
- Renders one item per schema choice.

### d. Event Handlers
- `onSelectSchema`: loads associated fields.

### e. Validation
- Ensures value matches selected schema structure.

### f. Options (`ui:options`)
- `multiValuedSchemes`
- `skipTitle`, `label`

### g. Dependencies
- Schema parser utilities (internal).

### h. Potential Improvements
- Improve UI label for schema selection dropdown.

---

## 9. `BoxArrayFieldTemplate`

### a. Purpose / Overview
Custom renderer for array fields using bordered “box” layout for each item.

### b. Rendered Fields / Attributes
- Renders children with title + border.
- Supports `titleSource` and `defaultTitle`.

### c. Layout and Styling
- Padding, border, spacing between items.

### d. Event Handlers
- Pass-through to children.

### e. Validation
- Inherited from array items.

### f. Options (`ui:options`)
- `titleSource`, `defaultTitle`, `style`

### g. Dependencies
- None external.

### h. Potential Improvements
- Add empty state rendering if array is empty.

---

## 10. `DropdownSelect`

### a. Purpose / Overview
Generic dropdown used for selecting from a dynamic set of autocomplete options.

### b. Rendered Fields / Attributes
- Dropdown with label and option text.
- Keyboard navigation support.

### c. Layout and Styling
- Styled list using form theme.

### d. Event Handlers
- `onClick`, `onKeyDown`, `onBlur`

### e. Validation
- N/A – handles rendering only.

### f. Options
- Controlled via props (not via ui:options).

### g. Dependencies
- None.

### h. Potential Improvements
- Add accessibility attributes (ARIA).

---

## 11. `AccordionArrayTemplate`

### a. Purpose / Overview
Renders array items in collapsible panels.

### b. Rendered Fields / Attributes
- Each item is shown inside an accordion panel.
- Panel title can be dynamic (`titleSource`).

### c. Layout and Styling
- Uses border, padding, and shadow.
- Expands/collapses using simple state toggle.

### d. Event Handlers
- Toggle handlers for open/close.
- Pass-through events for children.

### e. Validation
- Child validation shown inside panel.

### f. Options
- Inherits standard RJSF array props.

### g. Dependencies
- None external.

### h. Potential Improvements
- Highlight panel header if validation errors exist inside.

---

## 12. `UnitInput`

### a. Purpose / Overview
Shared logic to render and sync a numeric value and a unit concept.

### b. Rendered Fields / Attributes
- Numeric input field.
- Autocomplete for unit (via `AutoCompleteField` or `DropdownSelect`).

### c. Layout and Styling
- Side-by-side or stacked depending on parent context.

### d. Event Handlers
- Syncs composite value back to parent.

### e. Validation
- Ensures value/unit integrity.

### f. Options
- Receives props for ECL filtering of units.

### g. Dependencies
- `DropdownSelect` or `AutoCompleteField`.

### h. Potential Improvements
- Centralize all unit+value validation logic here and share.
