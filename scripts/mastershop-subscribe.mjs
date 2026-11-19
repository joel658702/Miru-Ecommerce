#!/usr/bin/env node
/**
 * Suscribe los webhooks de MasterShop a la URL de Miru.
 *
 * Uso:
 *   MS_API_KEY=... MS_WEBHOOK_URL=https://api.miruecommerce.pro/webhooks/mastershop/<id>?token=... \
 *     node scripts/mastershop-subscribe.mjs [--dry-run] [--events=15,16,17,18,27]
 *
 * La API key es un secreto: se pasa por variable de entorno, nunca en el repo.
 */
const API = "https://prod.api.mastershop.com";
const DEFAULT_EVENTS = [15, 16, 17, 18, 27];
const NAME = "Miru";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const eventsArg = args.find((arg) => arg.startsWith("--events="));
const events = eventsArg
  ? eventsArg
      .slice("--events=".length)
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isInteger(value) && value > 0)
  : DEFAULT_EVENTS;

const apiKey = process.env.MS_API_KEY ?? "";
const url = process.env.MS_WEBHOOK_URL ?? "";

if (apiKey === "" || url === "") {
  console.error("Faltan MS_API_KEY o MS_WEBHOOK_URL.");
  console.error("Ejemplo:");
  console.error(
    "  MS_API_KEY=xxx MS_WEBHOOK_URL=https://api.miruecommerce.pro/webhooks/mastershop/<id>?token=yyy node scripts/mastershop-subscribe.mjs",
  );
  process.exit(1);
}

if (!/^https:\/\//.test(url)) {
  console.error("La URL debe ser HTTPS.");
  process.exit(1);
}

console.log(`eventos: ${events.join(", ")}`);
console.log(`url:     ${url}`);
console.log(dryRun ? "modo:    dry-run (no llama a la API)\n" : "modo:    real\n");

let failed = 0;

for (const idWebhook of events) {
  const body = {
    idProduct: null,
    idWebhook,
    name: NAME,
    url,
    webhookName: NAME,
  };

  if (dryRun) {
    console.log(`[dry-run] POST /api/webhooks ${JSON.stringify(body)}`);
    continue;
  }

  const response = await fetch(`${API}/api/webhooks`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "ms-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  if (!response.ok) {
    failed += 1;
    console.log(`idWebhook=${idWebhook} ERROR ${response.status} ${text.slice(0, 300)}`);
    continue;
  }

  let parsed = {};
  try {
    parsed = JSON.parse(text);
  } catch {
    // Respuesta no JSON: se muestra el texto.
  }

  const idProductWebhook = parsed?.productWebhook?.idProductWebhook ?? "?";
  console.log(`idWebhook=${idWebhook} OK idProductWebhook=${idProductWebhook}`);
}

if (failed > 0) {
  console.error(`\n${failed} suscripción(es) fallaron.`);
  process.exit(1);
}

if (!dryRun) {
  console.log(
    "\nGuardar los idProductWebhook: sin ellos no se pueden desactivar las suscripciones.",
  );
}
