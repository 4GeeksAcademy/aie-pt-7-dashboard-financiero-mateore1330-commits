/**
 * Query parameter types for the three dashboard features:
 * date range filter, anomaly alerts table and B2B vs B2C comparison.
 *
 * Source of truth: the live OpenAPI 3.1.0 contract ("Financial Metrics API" v0.1.0)
 * at http://localhost:8000/docs, plus real requests (see api-exploration.md).
 *
 * Rules that apply to every type in this file:
 * - Property names are the API's query parameter names (snake_case), so they can be
 *   sent as they are, e.g. `?start_date=2026-03-01`.
 * - An optional property that has no value must be OMITTED from the query string.
 *   Never send it empty: `start_date=` returns 422.
 * - The API silently ignores unknown parameters and returns unfiltered data, so a
 *   misspelled name does not fail. Use these types to build the query.
 */

import type { BusinessType, OperationType } from './api-types'

/**
 * Optional date range shared by the three features.
 *
 * Sent as `start_date` / `end_date` to `GET /api/metrics` (Feature 1),
 * `GET /api/metrics/alerts` (Feature 2) and `GET /api/metrics/categories/top` (Feature 3).
 *
 * Behavior verified against the API:
 * - No dates: no filter, the full dataset is used.
 * - Only `start_date`: from that date to the end of the dataset.
 * - Only `end_date`: from the start of the dataset to that date.
 * - Both dates: both ends are INCLUDED (`>=` and `<=`). Equal dates select a single day.
 * - `start_date` later than `end_date`: the API does NOT fail, it returns an empty
 *   result (200). The client must validate `start_date <= end_date` before requesting.
 * - A range that does not overlap the dataset is valid but returns empty results.
 *   A range that only partly overlaps it returns the overlapping part. The available
 *   range is `FacetsResponse.min_date` to `FacetsResponse.max_date`.
 */
export interface DateRangeFilter {
  /**
   * First day of the range, inclusive.
   * Format: `YYYY-MM-DD` with two-digit month and day (OpenAPI `format: date`),
   * e.g. `"2026-03-01"`. This is the value an `<input type="date">` produces.
   * Invalid formats (`"13/01/2026"`, `"2026-3-1"`) and non-existent dates
   * (`"2026-02-30"`) return 422. Send only `YYYY-MM-DD`: the API also accepts some
   * other forms (a midnight datetime such as `"2026-03-01T00:00:00"`, a Unix timestamp),
   * so do not rely on it to validate the format.
   *
   * Optional. Omit it when the input is empty; do not send an empty string.
   */
  start_date?: string

  /**
   * Last day of the range, inclusive.
   * Format: `YYYY-MM-DD` with two-digit month and day (OpenAPI `format: date`),
   * e.g. `"2026-03-31"`. Same 422 rules as `start_date`.
   * Must not be earlier than `start_date` when both are set.
   *
   * Optional. Omit it when the input is empty; do not send an empty string.
   */
  end_date?: string
}

/**
 * Query parameters of `GET /api/metrics/alerts` for Feature 2 (anomaly alerts table).
 *
 * Includes the active Feature 1 date range (`DateRangeFilter`).
 *
 * The endpoint also accepts `group_by` (`"day"` | `"week"` | `"month"`, default `"month"`)
 * and `business_type`. Feature 2 does not send them: it uses monthly periods for the
 * whole business.
 */
export interface AlertsParams extends DateRangeFilter {
  /**
   * Minimum relative increase over the baseline for a period to be reported, as a ratio
   * (`0.3` = 30 %). A period is returned only when `increase_ratio > threshold` (strict).
   *
   * Valid values in the UI: `0.01` to `1.0`, both inclusive (PM brief).
   * Default: `0.3`.
   *
   * The API is wider: it accepts any number `>= 0` with no maximum (`0` is valid) and
   * returns 422 for negative or non-numeric values. The `0.01`–`1.0` range is a PM
   * requirement that only the client enforces: out-of-range values are not sent.
   *
   * Always sent, because the input always has a value (the default when untouched).
   */
  threshold: number
}

/**
 * Query parameters of `GET /api/metrics/categories/top` for Feature 3 (B2B vs B2C view).
 *
 * Includes the comparison's date range (`DateRangeFilter`). Feature 3 makes one request
 * per panel: one with `business_type: "B2B"` and one with `business_type: "B2C"`.
 */
export interface TopCategoriesParams extends DateRangeFilter {
  /**
   * Operation type whose categories are ranked.
   * Valid values: `"income"`, `"outcome"`. Feature 3 always sends `"income"`.
   *
   * Always send it: when it is omitted, the API defaults to `"outcome"` and returns
   * spending categories instead of income ones.
   */
  operation_type: OperationType

  /**
   * Maximum number of categories returned.
   * Valid values: integers from `1` to `20`, both inclusive. API default: `5`.
   * Feature 3 sends `5`. Values outside `1`–`20` and fractional values such as `5.5`
   * return 422 (an integral float such as `5.0` is accepted, but send integers).
   *
   * With `operation_type: "income"` the API returns at most 2 categories
   * (`"sales"` and `"others"`), even with `limit: 5`.
   */
  limit: number

  /**
   * Business line whose categories are ranked.
   * Valid values: `"B2B"`, `"B2C"` (uppercase; `"b2b"` returns 422).
   *
   * Not listed in the exercise brief (which only names operation type, limit and date
   * range), but required for Feature 3: without it the API mixes both business lines
   * and the two panels cannot be filled. The API itself treats it as optional.
   */
  business_type: BusinessType
}
