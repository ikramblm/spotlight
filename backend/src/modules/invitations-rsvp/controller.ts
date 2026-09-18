import type { Request, Response } from "express";
import { AppError } from "../../lib/AppError";
import * as invitationsService from "./service";
import type { SubmitRsvpInput } from "./schema";

function requireActor(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.id;
}

export async function generateInvitation(req: Request, res: Response) {
  const invitation = await invitationsService.generateInvitation(req.params.guestId as string, requireActor(req));
  res.status(201).json({ data: invitation });
}

export async function sendInvitation(req: Request, res: Response) {
  const invitation = await invitationsService.sendInvitation(req.params.id as string, requireActor(req));
  res.status(200).json({ data: invitation });
}

export async function getInvitation(req: Request, res: Response) {
  const { invitation, rsvp } = await invitationsService.getInvitation(req.params.id as string);
  res.status(200).json({ data: { ...invitation, rsvp } });
}

export async function getQrCode(req: Request, res: Response) {
  const png = await invitationsService.getQrCodePng(req.params.id as string);
  res.status(200).set("Content-Type", "image/png").send(png);
}

export async function getPublicInvitation(req: Request, res: Response) {
  const view = await invitationsService.getPublicInvitation(req.params.token as string);
  res.status(200).json({ data: view });
}

export async function submitRsvp(req: Request, res: Response) {
  const rsvp = await invitationsService.submitRsvp(req.params.token as string, req.body as SubmitRsvpInput);
  res.status(200).json({ data: rsvp });
}
