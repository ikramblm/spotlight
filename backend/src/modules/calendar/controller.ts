import type { Request, Response } from "express";
import * as calendarService from "./service";
import type { CalendarQuery, TodayCalendarQuery } from "./schema";

export async function getCalendar(req: Request, res: Response) {
  const filters = req.query as unknown as CalendarQuery;
  const entries = await calendarService.getCalendar(filters);
  res.status(200).json({ data: entries });
}

export async function getTodayCalendar(req: Request, res: Response) {
  const filters = req.query as unknown as TodayCalendarQuery;
  const entries = await calendarService.getTodayCalendar(filters);
  res.status(200).json({ data: entries });
}
