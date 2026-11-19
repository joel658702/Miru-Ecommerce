# Checklist técnica para la plataforma

## Antes de la prueba

- [ ] Leeron `ESPECIFICACION_MIRU_V1.md`.
- [ ] Reproducen la firma del vector de prueba (**sección 5**).
- [ ] Tienen el `connection_id` y el secreto de su canal (enviados aparte).
- [ ] Su emisor envía `Content-Type: application/json`.
- [ ] El `x-miru-timestamp` se genera al momento del envío y su reloj está en hora.

## En la prueba

- [ ] Un `order.upserted` de prueba responde `200 {"status":"accepted"}`.
- [ ] Reenviar el mismo `event_id` responde `200 {"status":"duplicate"}`.
- [ ] Un pedido con `status: "entregado"` se ve reflejado en el panel de Miru.
- [ ] Un cambio de estado posterior con `external_updated_at` mayor actualiza el pedido.
- [ ] Un `external_updated_at` menor **no** modifica el pedido (regla de orden).
- [ ] Un pago/estado inválido responde `422` con `error: "invalid_payload"`.

## Producción

- [ ] URL y secreto de **producción** configurados en su emisor.
- [ ] Reintentos con el mismo `event_id` y backoff 2–32 s.
- [ ] Timeout de 5 s.
- [ ] Monitoreo de respuestas `4xx`/`5xx` de su lado.
- [ ] Contacto técnico de ambas partes para incidentes.

## Lo que Miru **no** comparte

- Acceso a su base de datos.
- `service_role` ni claves de Supabase.
- Secretos de otros canales.
