/**
 * Response types for the three dashboard features:
 * date range filter, anomaly alerts table and B2B vs B2C comparison.
 *
 * Source of truth: the live OpenAPI 3.1.0 contract ("Financial Metrics API" v0.1.0)
 * at http://localhost:8000/docs. Every property below was checked against it and
 * against real requests (see api-exploration.md).
 *
 * Rules that apply to every type in this file:
 * - All properties are required and none is nullable (all are `required` in /docs).
 * - Property names keep the API's snake_case so responses can be used without mapping.
 *
 * Feature 1 also reads `GET /api/metrics`, whose response (`FinancialMovement[]`) is
 * already typed in `src/lib/financial-types.ts` and matches /docs. It is not redefined here.
 */

import type {
  BusinessType,
  Category,
  OperationType,
} from '../src/lib/financial-types'

// The enums already exist in the app and match /docs exactly. They are reused, not redefined.
export type { BusinessType, Category, OperationType }

/**
 * Response of `GET /api/metrics/facets` (schema `MetricsFacets`).
 *
 * The endpoint takes no query parameters: it always describes the full dataset,
 * whatever date range or business line the user has selected.
 *
 * Used by:
 * - Feature 1, to show the available date range next to the date inputs.
 * - Feature 3, to know which business lines exist (one panel per value).
 */
export interface FacetsResponse {
  /**
   * Operation types present in the dataset, sorted alphabetically.
   * Valid values: `"income"`, `"outcome"`.
   */
  operation_types: OperationType[]

  /**
   * Business lines present in the dataset, sorted alphabetically.
   * Valid values: `"B2B"`, `"B2C"`.
   */
  business_types: BusinessType[]

  /**
   * Categories present in the dataset, sorted alphabetically.
   * Valid values: `"administrative"`, `"operational"`, `"others"`, `"sales"`, `"suppliers"`.
   *
   * Mixes income and outcome categories and is NOT split by business line.
   * It cannot tell which categories belong to B2B or B2C: the categories of each
   * Feature 3 panel come from `GET /api/metrics/categories/top`.
   */
  categories: Category[]

  /**
   * Date of the oldest movement in the dataset.
   * Format: `YYYY-MM-DD` (OpenAPI `format: date`), e.g. `"2025-11-01"`.
   *
   * It is the first movement's date, not the first day of a month. The dataset is
   * regenerated from today's date, so this value changes over time: never hard-code it.
   */
  min_date: string

  /**
   * Date of the most recent movement in the dataset.
   * Format: `YYYY-MM-DD` (OpenAPI `format: date`), e.g. `"2026-10-28"`.
   *
   * It is the last movement's date, not the last day of a month. It changes over time:
   * never hard-code it.
   */
  max_date: string
}

/**
 * One row of `GET /api/metrics/alerts` (schema `MetricsAlert`): a period whose
 * outcome (spending) rose above its baseline by more than the requested threshold.
 *
 * Used by Feature 2 (anomaly alerts table). One entry = one table row.
 */
export interface AlertEntry {
  /**
   * Period the alert refers to.
   * Format with the default `group_by=month` (the only one the spec uses): `YYYY-MM`, e.g. `"2026-03"`.
   * (`group_by=week` would give `YYYY-Www`, e.g. `"2025-W46"`; `group_by=day` gives `YYYY-MM-DD`.)
   *
   * If the date range starts or ends mid-month, the first and last periods are
   * partial months and their totals are smaller.
   */
  period: string

  /**
   * Total outcome (spending) recorded in `period`, in the dataset's currency units.
   * Always `> baseline_average` (and therefore `> 0`). Rounded to 2 decimals.
   *
   * PM column: "outcome registrado".
   */
  outcome_total: number

  /**
   * Baseline the period is compared against, in currency units. Always `> 0`.
   * Rounded to 2 decimals.
   *
   * It is the mean outcome of ALL previous periods inside the requested date range
   * (only periods that have movements count: periods with no data are skipped),
   * NOT a 3-period moving average as the PM brief says (verified by recomputing it:
   * for 2026-03 the API returns 55334.29, while the last-3 mean would be 59977.58).
   * Open question for the PM. Because only periods inside the range count, the same
   * period can have a different baseline when the date range changes.
   *
   * PM column: "media móvil de los 3 períodos anteriores".
   */
  baseline_average: number

  /**
   * Relative increase over the baseline: `(outcome_total - baseline_average) / baseline_average`.
   * It is a RATIO, not a percentage: `1.4968` means +149.68 %. Multiply by 100 before
   * formatting it with `formatPercent`. Rounded to 4 decimals.
   *
   * The API compares the UNROUNDED ratio with `>`, so a ratio exactly equal to the
   * threshold is not returned. The returned value is rounded afterwards, so it is
   * `>= threshold` (e.g. a raw 0.30004 passes `> 0.3` and is returned as `0.3`).
   * Recomputing it from the rounded `outcome_total` and `baseline_average` may differ
   * in the 4th decimal: display this field, do not recompute it.
   *
   * PM column: "incremento porcentual".
   */
  increase_ratio: number
}

/**
 * Response of `GET /api/metrics/alerts`.
 *
 * The API returns a bare JSON array, not an object wrapping it. This alias exists
 * because the exercise names the type `AlertsResponse`.
 *
 * - Sorted chronologically by `period` (oldest first).
 * - The first period of the requested range can never appear (it has no previous periods).
 * - An empty array `[]` is a valid 200 response meaning "no anomalies for this threshold
 *   and range": it is not an error.
 */
export type AlertsResponse = AlertEntry[]

/**
 * One row of `GET /api/metrics/categories/top` (schema `TopCategoryItem`):
 * the total amount of one category for the requested operation type.
 *
 * Used by Feature 3 (B2B vs B2C tables). One entry = one table row.
 */
export interface CategoryEntry {
  /**
   * Category name.
   * Valid values: `"suppliers"`, `"sales"`, `"operational"`, `"administrative"`, `"others"`.
   * With `operation_type=income` only `"sales"` and `"others"` can appear, because
   * incomes are only generated in those two categories.
   */
  category: Category

  /**
   * Operation type the total refers to. It always echoes the `operation_type` query parameter.
   * Valid values: `"income"`, `"outcome"`. Feature 3 always requests `"income"`.
   */
  operation_type: OperationType

  /**
   * Sum of the amounts of this category inside the requested filters, in currency units.
   * Always `> 0`. Rounded to 2 decimals.
   *
   * The API does NOT return the share of the group total ("porcentaje sobre el total del
   * grupo"): the client computes it as `total_amount / sum(total_amount of the panel) * 100`.
   * That sum is the real income total of the business line only because `limit` (5) is
   * at least the number of income categories (2), so no category is cut off. The same
   * sum is the value of that business line in the B2B vs B2C chart.
   */
  total_amount: number
}

/**
 * Response of `GET /api/metrics/categories/top`.
 *
 * The API returns a bare JSON array, not an object wrapping it. This alias exists
 * because the exercise names the type `TopCategoriesResponse`.
 *
 * - Sorted by `total_amount`, highest first.
 * - Length is between 0 and `limit`. With `operation_type=income` it has at most 2
 *   entries, even with `limit=5`. A short date range can return 1 entry or none for one
 *   business line (e.g. a single day with no B2B income).
 * - An empty array `[]` is a valid 200 response meaning "no movements of this type in
 *   these filters": it is not an error.
 */
export type TopCategoriesResponse = CategoryEntry[]
