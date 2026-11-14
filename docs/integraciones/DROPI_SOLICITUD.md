# Solicitud de documentación oficial — Dropi

**Estado:** borrador listo para enviar. Este archivo **no** se envía solo: lo envía el dueño
del proyecto desde su correo o el canal de soporte de Dropi.

**Motivo:** construir el adaptador nativo → contrato canónico Miru v1 sin inventar endpoints ni
payloads (D-11). Es el bloqueo externo más largo del proyecto.

---

## Correo / mensaje para el equipo técnico de Dropi

**Asunto:** Solicitud de documentación técnica de API y webhooks — integración Miru

Buen día,

Mi nombre es Joel Miranda y estoy construyendo **Miru-Ecommerce**, una plataforma que
centraliza pedidos, garantías, transportadoras y finanzas para vendedores de dropshipping en
Colombia. Queremos integrar Dropi como canal de origen de pedidos.

Para hacerlo correctamente —y sin asumir comportamientos que no estén documentados— necesitamos
la documentación oficial de su API y de sus webhooks. Concretamente:

1. **Webhooks**
   - Catálogo de eventos disponibles y semántica de cada uno.
   - Payload de ejemplo por evento (JSON completo, con valores de ejemplo).
   - Cabeceras que envía Dropi (nombres exactos y formato).
   - Mecanismo de autenticidad de la notificación: ¿firma HMAC? ¿con qué algoritmo, sobre qué
     bytes exactos (body crudo o JSON re-serializado) y con qué nombre de cabecera?
   - Política de reintentos: cuántos, con qué espaciado y qué respuesta considera éxito.
   - Ventana de tolerancia esperada para el timestamp, si aplica.
   - Identificador de evento único y estable (para idempotencia) y clave de orden
     (por ejemplo, fecha de actualización del pedido).
   - Comportamiento ante fallos (timeouts, 4xx/5xx) y si hay lista de IPs de salida.

2. **API**
   - Base URL por ambiente (producción y pruebas/sandbox).
   - Autenticación: tipo de credencial, vigencia, rotación y alcance de permisos.
   - Endpoints de pedidos, productos, transportadoras y estados, con ejemplos de request y
     response.
   - Rate limits, paginación y filtros por fecha de actualización.
   - Manejo de errores y códigos documentados.

3. **Datos de prueba**
   - Ambiente sandbox y credenciales de prueba.
   - Un pedido de ejemplo end-to-end (creación → cambio de estado → novedad → entrega) para
     validar nuestra ingesta.

4. **Contrato y versionado**
   - Versión actual del contrato y política de cambios (changelog, deprecaciones).
   - Contacto técnico para dudas de integración.

Nuestra arquitectura no almacena datos de otros vendedores y solo procesa pedidos de la cuenta
autorizada. Podemos firmar un acuerdo de confidencialidad si lo requieren.

Quedo atento a la documentación o a una llamada técnica de 30 minutos para alinear detalles.
Muchas gracias.

**Joel Miranda**
Miru-Ecommerce
[correo de contacto] · [teléfono]

---

## Checklist de la misma solicitud para Effi y MasterShop

- [ ] Documentación de API (base URL, auth, endpoints, rate limits).
- [ ] Capacidad de webhooks: eventos, payloads de ejemplo, firma, reintentos.
- [ ] Identificador único de evento y clave de orden.
- [ ] Ambiente de pruebas y credenciales.
- [ ] Política de versionado del contrato.
- [ ] Contacto técnico.

## Qué hacemos cuando llegue la documentación

1. Guardar los documentos oficiales en `docs/integraciones/<plataforma>/`.
2. Extraer a `docs/integraciones/<plataforma>/eventos.md` el catálogo de eventos con payloads
   de ejemplo **copiados de la fuente**, nunca inventados.
3. Escribir el adaptador en `apps/ingest` contra esos documentos y añadir fixtures de test con
   los payloads reales anonimizados.
4. Solo entonces se amplía el contrato v1 si hace falta (por ejemplo, eventos de garantía) —
   decisión del arquitecto, no del implementador.
