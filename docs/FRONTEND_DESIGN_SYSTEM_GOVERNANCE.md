# Frontend Design System Governance

This document defines how the DentalCare frontend should use the stabilized clinical design system as the app grows.

The goal is consistency first: predictable spacing, readable dashboards, accessible forms, and reusable primitives that stay shallow.

## Core Rules

- Use centralized tokens only for color, spacing, radius, typography, and shadow decisions.
- Prefer composition over new abstractions.
- Keep business logic in pages and feature modules, not in UI primitives.
- Treat primitives as visual and accessibility contracts, not workflow owners.
- Avoid custom one-off styles unless they are temporary and page-local, and only if they do not introduce a repeatable pattern.

## When To Create A New Primitive

Create a new primitive only when all of the following are true:

- The same visual pattern appears in at least 3 places or is clearly becoming systemic.
- The pattern is mostly presentational and not coupled to one role, one workflow, or one domain entity.
- The primitive can keep a shallow API without knowing business rules.
- The pattern can be described using existing tokens and existing primitive conventions.
- The new component reduces duplicated class strings, not just file count.

## When Not To Create A New Primitive

Do not create a new primitive when:

- The pattern exists in only one page or one workflow.
- The component would need to know business meanings like patient status, financial category, appointment state, or role-specific copy.
- The abstraction would need many conditional props to cover unrelated use cases.
- A page can be composed from `Card`, `Button`, `Input`, `SelectControl`, `Modal`, `DataTable`, `SectionHeader`, `DashboardSectionLayout`, or `KPIStatCard` without adding new layers.
- The pattern is mostly content, not structure.

## Approved Primitives And Responsibilities

### `Button`

- Responsibilities: primary, secondary, ghost, and danger actions with token-based sizing and focus states.
- Non-responsibilities: routing logic, confirmation flows, asynchronous orchestration, or page-specific copy.

### `Card`

- Responsibilities: surface container, border, radius, shadow, and background for grouped content.
- Non-responsibilities: layout grids, headers, empty states, or interactive behavior.

### `DashboardSectionLayout`

- Responsibilities: section shell for dashboard pages with header, actions, and consistent vertical rhythm.
- Non-responsibilities: page data loading, chart configuration, table composition, or workflow logic.

### `KPIStatCard`

- Responsibilities: single headline metric with label, optional badge, icon, and footer.
- Non-responsibilities: metric calculation, financial formatting rules, trend computation, or role-specific semantics.

### `DataTable`

- Responsibilities: table frame, scrolling container, loading shell, and empty-state slot.
- Non-responsibilities: row rendering, column definitions, filtering rules, pagination logic, or data fetching.

### `EmptyState`

- Responsibilities: standard empty-state presentation with icon, title, description, and action.
- Non-responsibilities: deciding why data is empty or what the fallback workflow should be.

### `Input`

- Responsibilities: labeled text inputs, textareas, helper/error text, prefixes, suffixes, and accessible wiring.
- Non-responsibilities: parsing business data, masking domain formats, or submitting forms.

### `Modal`

- Responsibilities: accessible dialog shell, overlay, dismissal behavior, header, and optional footer.
- Non-responsibilities: form validation, state persistence, or task-specific step flows.

### `SectionHeader`

- Responsibilities: eyebrow, title, description, and action alignment for section headers.
- Non-responsibilities: content grouping or page-specific shell logic.

### `SelectControl`

- Responsibilities: labeled select field with helper/error text, prefix/suffix support, and tokenized styling.
- Non-responsibilities: loading options, cascading selects, remote filtering, or special picker behavior.

## Spacing And Typography Rules

- Use the tokenized spacing scale only: `layout`, `section`, `card`, `control`, and `control-lg`.
- Use `text-page-title`, `text-section-title`, `text-body`, `text-label`, and `text-caption` for semantic hierarchy.
- Avoid arbitrary size jumps unless a component already exposes them through its API.
- Keep vertical rhythm predictable: page shell, section header, content block, then action row.
- Prefer calm density. Use enough whitespace to scan comfortably, but avoid oversized hero spacing in operational screens.

## Dashboard Composition Rules

- Dashboard pages should follow this order when appropriate: header, filter/control bar, KPI row, analytics panels, tables, then detail sections.
- Use `DashboardSectionLayout` for page-level dashboard shells.
- Use `SectionHeader` for section titles and actions inside a dashboard.
- Use `Card` for grouped panels, not for every small wrapper.
- Keep analytics panels visually consistent: same header treatment, same padding rhythm, same empty-state treatment.
- Do not invent new dashboard shells for each role unless the role truly changes the information architecture.

## Table Rules

- Use `DataTable` for frame, scroll, and loading/empty shells.
- Keep header labels short and scannable.
- Preserve row density, but do not compress to the point that text wraps awkwardly on desktop.
- Align numbers and monetary values consistently to the right.
- Use token colors for hover, borders, and surface contrast.
- Keep actions in a predictable rightmost column or a consistent action cell.
- Avoid nesting unrelated cards inside table rows.

## Form Rules

- Use `Input` and `SelectControl` for standard fields.
- Use `Modal` for short, focused create/edit flows.
- Keep forms readable in one pass: label, field, helper text, and errors should remain visually aligned.
- Prefer field grouping in responsive grids, usually one column on mobile and two columns on desktop when the data model allows it.
- Keep submit and cancel actions in a consistent footer row.
- Do not hide validation semantics inside custom field wrappers.

## Responsive Behavior Rules

- Mobile-first layouts are required.
- Dashboards should collapse from multi-column grids to one column without losing meaning.
- Tables may scroll horizontally, but the frame and header should remain readable.
- Filter bars should wrap naturally; do not force a single row if it harms clarity.
- Modal width should scale by task complexity, not by screen size alone.
- Preserve tap targets and spacing on small screens; do not reduce controls below comfortable touch size.

## Semantic Color Rules

- Use `canvas` for page background, `surface` for cards, `surface-muted` for secondary blocks, `border` for separators, `ink` for primary text, and `muted` for secondary text.
- Use semantic color families for meaning, not decoration:
  - `primary` for neutral product actions and brand-aligned emphasis.
  - `success` for positive outcomes.
  - `warning` for caution or attention.
  - `danger` for destructive or negative states.
  - `accent` for secondary analytical emphasis.
- Do not introduce new semantic colors unless they map to a durable product meaning.
- Avoid using color alone to communicate state when text or iconography can reinforce the meaning.

## Modal Behavior Rules

- Modal content should be narrow in scope and fast to complete.
- Use accessible dialog semantics, keyboard dismissal, and overlay dismissal behavior consistently.
- Keep the header fixed in meaning: title and optional description.
- Keep footer actions aligned and predictable.
- Do not place long-running or multi-step workflows in a modal if they belong in a dedicated page or drawer.
- Avoid stacking modals or building modal-specific one-off layouts.

## Accessibility Consistency Rules

- Every interactive control must have a visible label or an equivalent accessible name.
- Preserve focus states and keyboard reachability.
- Ensure modal dialogs trap interaction appropriately and expose a close action.
- Keep color contrast readable on all tokenized surfaces.
- Use semantic HTML first; do not replace native controls with div-based simulations unless necessary.
- Ensure table headers, button roles, and form field associations remain intact.

## Avoiding Over-Abstraction

- A primitive should describe structure, not business meaning.
- If a prop only exists to support one page, that prop is a warning sign.
- If a primitive starts needing many tone, density, and workflow flags, stop and split the use cases.
- Favor one good page-local composition over a global abstraction that hides behavior.
- Do not create “universal” components that mix tables, cards, filters, and action flows into a single API.

## Examples Of Acceptable Vs Unacceptable Abstraction

### Acceptable

- `KPIStatCard` for a headline number with label, badge, and footer.
- `SelectControl` for native dropdowns with accessible labels and consistent styling.
- `DashboardSectionLayout` for a dashboard page shell with actions and section rhythm.
- `DataTable` for a reusable frame around different row renderers.

### Unacceptable

- A `PatientFinancialDashboardTile` that hardcodes patient and financial semantics into a supposedly generic card.
- A `UniversalPicker` that tries to replace select, autocomplete, date picker, and search all at once.
- A `MegaDashboardPanel` that combines header, filters, metrics, charts, table, and modal triggers in one component.
- A `SmartFormField` that owns validation, label rendering, help text, masking, and submission side effects for every page.

## Migration Guidelines For Remaining Legacy Pages

- Migrate the shell first: header, spacing, and action layout.
- Replace repeated panel wrappers with `Card` or `DashboardSectionLayout`.
- Replace repeated dropdowns with `SelectControl` before touching any workflow logic.
- Replace stat blocks with `KPIStatCard` only when the content is a simple headline metric.
- Use `DataTable` for consistent table shells, then migrate rows and cell content selectively.
- Use `Modal` for create/edit flows when the workflow already behaves like a bounded dialog.
- Do not refactor page behavior and design system structure in the same pass unless the page is already low-risk.

## Criteria For Introducing Specialized Primitives Later

Introduce a specialized primitive only if all of these are true:

- The pattern appears across multiple pages and multiple roles.
- The pattern is structurally stable after repeated real usage.
- The primitive can keep a shallow API without business-specific props.
- The specialized version improves readability or accessibility, not just code reuse.
- The component does not force unrelated pages into the same model.
- There is a clear owner for the pattern and a realistic maintenance path.

Potential future candidates include a dedicated table toolbar, a chart frame primitive, or a richer field group wrapper, but only after the current primitives have been used widely enough to prove the shape.

## Governance Summary

- Reuse first.
- Abstract only repeated structural patterns.
- Keep business rules out of primitives.
- Stay token-based.
- Prefer calm clinical clarity over visual novelty.
