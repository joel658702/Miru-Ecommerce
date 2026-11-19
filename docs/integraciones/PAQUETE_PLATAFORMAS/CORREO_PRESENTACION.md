# Correo de presentación (plantilla)

Asunto: **Integración Miru v1 · webhook de pedidos**

---

Hola equipo de **[Plataforma]**:

Somos Miru-Ecommerce, la plataforma que centraliza pedidos, garantías y finanzas
de nuestros canales de dropshipping. Queremos recibir sus pedidos y
actualizaciones de estado por webhook.

Envío adjunto:

1. La especificación del contrato **miru.v1** (endpoint, firma HMAC, payload,
   códigos de respuesta y política de reintentos).
2. Un evento de ejemplo con su vector de firma, para que validen su
   implementación sin depender de nosotros.

Puntos clave:

- Endpoint por canal: `https://api.miruecommerce.pro/webhooks/miru/v1/<connection_id>`
  (les entregamos el suyo por separado).
- Autenticación: HMAC-SHA256 del body crudo en `x-miru-signature` + timestamp en
  `x-miru-timestamp` (±5 minutos).
- Montos en **centavos** enteros.
- Respondemos `200` en menos de 500 ms; `200 duplicate` si se repite el
  `event_id` (reintentos seguros).

Cuando confirmen que pueden firmar y recibir el `200` en su entorno de pruebas,
les enviamos el `connection_id` y el secreto de su canal por un medio privado, y
agendamos una prueba con un pedido real.

Quedo atento.

**[Nombre]**
[Correo] · [Teléfono]
Miru-Ecommerce · https://miruecommerce.pro
