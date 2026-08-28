import { deliverLeadEmail } from '../_shared/lead-mailer.js';
import { json, errorResponse } from '../_shared/http.js';

function cleanText(value, maximum) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maximum);
}

function validateLead(body) {
  if (cleanText(body?.company, 120)) {
    throw new Error('Unable to submit this request.');
  }

  const name = cleanText(body?.name, 100);
  const email = cleanText(body?.email, 160).toLowerCase();
  const phone = cleanText(body?.phone, 40);
  const zip = cleanText(body?.zip, 16);
  const vin = cleanText(body?.vin, 17).toUpperCase();
  const contactPreference = cleanText(body?.contactPreference, 20);
  const message = cleanText(body?.message, 1200);
  const towCapacity = cleanText(body?.towCapacity, 40);
  const payloadCapacity = cleanText(body?.payloadCapacity, 40);

  if (name.length < 2) {
    throw new Error('Enter your name so a RAM Tow Expert can follow up.');
  }
  if (!email && !phone) {
    throw new Error('Enter an email address or phone number.');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    throw new Error('Run a valid VIN before requesting confirmation.');
  }
  if (!['email', 'phone', 'text'].includes(contactPreference)) {
    throw new Error('Choose how you would like to be contacted.');
  }
  if (body?.consent !== true) {
    throw new Error('Confirm that you agree to be contacted about this request.');
  }

  return { name, email, phone, zip, vin, contactPreference, message, towCapacity, payloadCapacity };
}

export async function onRequestPost(context) {
  try {
    const lead = validateLead(await context.request.json());
    await deliverLeadEmail(context.env, lead);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error, 400);
  }
}
