# Paquete para las plataformas (Dropi · MasterShop · Effi)

Esto es lo que se entrega a los técnicos de cada plataforma para conectar la
integración. Todo lo que necesitan está en esta carpeta.

## Qué enviar a cada plataforma

| #   | Dato                                                            | Dónde está                                                |
| --- | --------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | Documento de integración (endpoint, firma, payload, respuestas) | `ESPECIFICACION_MIRU_V1.md`                               |
| 2   | Ejemplo de evento real                                          | `ejemplo-order.upserted.json`                             |
| 3   | Vector de prueba de la firma                                    | sección 5 del documento                                   |
| 4   | `connection_id` de su canal                                     | `DATOS_A_COMPARTIR.md` (se completa al crear la conexión) |
| 5   | Secreto HMAC de su canal                                        | **por canal privado**, nunca en el repositorio            |
| 6   | Correo de contacto técnico                                      | `DATOS_A_COMPARTIR.md`                                    |

## Orden de la conversación

1. Enviar el correo de `CORREO_PRESENTACION.md` con el documento y el ejemplo.
2. Ellos confirman que pueden firmar y responder al `200` en el sandbox.
3. Se crea la conexión en Miru y se les pasa `connection_id` + secreto por canal privado.
4. Prueba conjunta con un pedido real de prueba.
5. Se activa el canal en producción.

## Archivos

| Archivo                       | Para qué                                  |
| ----------------------------- | ----------------------------------------- |
| `ESPECIFICACION_MIRU_V1.md`   | Contrato técnico completo (autocontenido) |
| `ejemplo-order.upserted.json` | Payload canónico de prueba                |
| `DATOS_A_COMPARTIR.md`        | Plantilla con los datos por plataforma    |
| `CORREO_PRESENTACION.md`      | Texto listo para enviar                   |
| `CHECKLIST_TECNICA.md`        | Lista de verificación para su equipo      |

## Regla de oro

No se comparte `service_role` ni acceso a Supabase. Solo reciben:

- URL del webhook de **su** conexión.
- Secreto HMAC de **su** conexión.
- El contrato y los ejemplos.
