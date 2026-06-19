import { Hono } from 'hono';
import type { AppContext } from '../env';
import { requireAuth } from '../lib/session';
import { audit } from '../lib/db';

export const aiApp = new Hono<AppContext>();

aiApp.use('*', requireAuth);

const STYLE_GUIDE = `Je helpt bij de website van Stichting Gemeenschapsservice
Nijmegen Stad en Land — een ANBI die sociaal-charitatieve projecten
ondersteunt en nauw samenwerkt met Rotaryclub Nijmegen Stad en Land.

Schrijfstijl:
- Formeel, helder, kort. Geen jargon.
- Spreek de lezer met "u" aan, niet "je".
- Nederlandse spelling (Groene Boekje).
- Geen overdrijving of marketingtaal.
- Termen consistent: "de stichting", "het bestuur", "de Raad van Advies",
  "Rotaryclub Nijmegen Stad en Land" (niet "Rotary Club").
- Geldbedragen: "€ 1.000" met spatie en harde punt als duizendsep.
- Datums: voluit (bv. "23 mei 1984").

Geef altijd alleen de nieuwe tekst terug — geen toelichting, geen
markdown-codeblok, geen aanhalingstekens eromheen. Behoud markdown-
opmaak als die in de input zit (## koppen, lijsten, **vet**).`;

const ACTION_PROMPTS: Record<string, string> = {
  improve:
    'Verbeter onderstaande tekst: helderder zinnen, betere flow, behoud betekenis en lengte ongeveer gelijk. Corrigeer spelling en grammatica.',
  shorten:
    'Maak onderstaande tekst korter en compacter zonder belangrijke informatie te verliezen. Streef naar ongeveer 30% minder woorden.',
  formal:
    'Maak onderstaande tekst formeler en zakelijker, passend bij een stichtingswebsite. Behoud de inhoud.',
  check:
    'Controleer onderstaande tekst op spelling, grammatica en consistentie met de stijlgids. Geef alleen de gecorrigeerde versie terug.',
};

aiApp.post('/transform', async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json<{
    action?: string;
    instruction?: string;
    text: string;
    field?: string;
  }>();

  if (!body.text || body.text.length > 20_000) {
    return c.json({ error: 'Tekst ontbreekt of is te lang.' }, 400);
  }

  let instruction: string;
  if (body.action && ACTION_PROMPTS[body.action]) {
    instruction = ACTION_PROMPTS[body.action];
  } else if (body.instruction) {
    instruction = `Pas onderstaande tekst aan volgens deze instructie: "${body.instruction}". Geef alleen de aangepaste tekst terug.`;
  } else {
    return c.json({ error: 'Geen actie of instructie opgegeven.' }, 400);
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': c.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: STYLE_GUIDE,
      messages: [
        {
          role: 'user',
          content: `${instruction}\n\n---\n${body.text}\n---`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[ai] anthropic-fout', res.status, errText);
    return c.json({ error: 'AI-aanvraag mislukt.' }, 502);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text =
    data.content?.find((b) => b.type === 'text')?.text?.trim() ?? '';

  await audit(c.env, user.id, 'ai.transform', body.field ?? null, {
    action: body.action,
    chars_in: body.text.length,
    chars_out: text.length,
  });

  return c.json({ text });
});
