#!/usr/bin/env node
/**
 * Firma un webhook Miru v1 para probar la integración.
 *
 * Uso:
 *   node scripts/firmar-webhook.mjs <payload.json> [secreto]
 *
 * El secreto también se puede pasar en MIRU_WEBHOOK_HMAC_SECRET.
 * Imprime la firma, el timestamp y un comando `curl` listo para usar.
 */
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const [, , fileArg, secretArg] = process.argv;
const secret = secretArg ?? process.env.MIRU_WEBHOOK_HMAC_SECRET ?? "";

if (fileArg === undefined || secret === "") {
  console.error("Uso: node scripts/firmar-webhook.mjs <payload.json> [secreto]");
  console.error("     (o define MIRU_WEBHOOK_HMAC_SECRET)");
  process.exit(1);
}

const raw = readFileSync(fileArg);
const timestamp = Math.floor(Date.now() / 1000);
const signature = `sha256=${createHmac("sha256", secret).update(raw).digest("hex")}`;

let summary = "payload no es JSON";
try {
  const parsed = JSON.parse(raw.toString("utf8"));
  summary = `${parsed.event_type ?? "?"} · event_id=${parsed.event_id ?? "?"} · external_id=${
    parsed.order?.external_id ?? "?"
  }`;
} catch {
  // Se firma igual: el servidor responderá 400 invalid_json.
}

console.log(`payload:    ${fileArg} (${raw.length} bytes)`);
console.log(`evento:     ${summary}`);
console.log(`timestamp:  ${timestamp}`);
console.log(`firma:      ${signature}`);
console.log("");
console.log("curl:");
console.log(
  `curl -X POST "http://127.0.0.1:3001/webhooks/miru/v1/$CONNECTION_ID" \\\n` +
    `  -H 'content-type: application/json' \\\n` +
    `  -H 'x-miru-signature: ${signature}' \\\n` +
    `  -H 'x-miru-timestamp: ${timestamp}' \\\n` +
    `  --data-binary @${fileArg}`,
);
