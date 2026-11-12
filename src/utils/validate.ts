import type { Contact, ContactErrors } from "../types";
import { MSG } from "./messages";

export function validateContact(c: Contact, requiresPhone: boolean): ContactErrors {
  const e: ContactErrors = {};
  if (!c.firstName.trim()) e.firstName = MSG.validation.firstName;
  if (!c.lastName.trim()) e.lastName = MSG.validation.lastName;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = MSG.validation.email;
  const phone = c.phone.trim();
  if (!phone && requiresPhone) e.phone = MSG.validation.phoneRequired;
  else if (phone && !/^[+\d][\d\s.()-]{7,}$/.test(phone)) e.phone = MSG.validation.phone;
  return e;
}