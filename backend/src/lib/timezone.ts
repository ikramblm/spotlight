/**
 * The venue's own timezone, used everywhere a `timestamptz` is converted to a calendar date
 * (event_date, "today" for check-in). Algeria uses a single fixed UTC+1 offset with no DST
 * since 1981, so a constant is safe - this becomes a per-venue setting once Spotlight supports
 * venues outside Algeria.
 *
 * Deriving event_date from the DB session's implicit timezone (usually UTC) instead of this
 * constant is a real bug: a booking starting at 23:30 UTC is already "tomorrow" in Algiers,
 * so date-range and "today" queries would disagree by a day near midnight UTC.
 */
export const VENUE_TIMEZONE = "Africa/Algiers";

/** SQL fragment: casts a timestamptz parameter to the venue-local calendar date. */
export function venueDateExpr(sqlExpr: string): string {
  return `((${sqlExpr})::timestamptz AT TIME ZONE '${VENUE_TIMEZONE}')::date`;
}
