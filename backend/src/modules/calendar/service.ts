import * as calendarRepo from "./repository";
import type { CalendarQuery, TodayCalendarQuery } from "./schema";

export function getCalendar(filters: CalendarQuery) {
  return calendarRepo.listCalendarEntries(filters);
}

export function getTodayCalendar(filters: TodayCalendarQuery) {
  return calendarRepo.listTodayEntries(filters.hallId);
}
