function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function deliverLeadEmail(env, lead) {
  const apiKey = String(env?.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('Lead delivery is not configured yet. Please try again shortly.');
  }

  const target = String(env?.LEAD_RECIPIENT_EMAIL || 'jforseth@perkinsmotors.com').trim();
  const sender = String(env?.LEAD_FROM_EMAIL || 'RAM Tow Leads <leads@ramtow.com>').trim();
  const contact = [lead.email, lead.phone].filter(Boolean).join(' | ');
  const rows = [
    ['Name', lead.name],
    ['Contact', contact],
    ['ZIP', lead.zip || 'Not provided'],
    ['Preferred contact', lead.contactPreference],
    ['VIN', lead.vin],
    ['Tow capacity result', lead.towCapacity || 'Not available'],
    ['Payload result', lead.payloadCapacity || 'Not available'],
    ['Request', lead.message || 'Please confirm this RAM towing and payload setup.'],
  ];
  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const html = `<h2>New RAM Tow inquiry</h2><table>${rows.map(([label, value]) => `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('')}</table>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender,
      to: [target],
      reply_to: lead.email || undefined,
      subject: `RAM Tow request: ${lead.name} | ${lead.vin}`,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error('We could not send your request right now. Please try again shortly.');
  }
}
