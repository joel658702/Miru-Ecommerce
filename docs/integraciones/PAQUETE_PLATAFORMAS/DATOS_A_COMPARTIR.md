# Datos por plataforma (plantilla)

Completar una fila por canal cuando se cree la conexión en Miru. El **secreto no
se escribe en este archivo**: se envía por canal privado y se guarda solo en el VPS.

| Plataforma | Estado    | `connection_id` | URL del webhook                                       | Secreto HMAC      | Contacto técnico    |
| ---------- | --------- | --------------- | ----------------------------------------------------- | ----------------- | ------------------- |
| Dropi      | pendiente | _(se asigna)_   | `https://api.miruecommerce.pro/webhooks/miru/v1/<id>` | por canal privado | _(nombre + correo)_ |
| MasterShop | pendiente | _(se asigna)_   | `https://api.miruecommerce.pro/webhooks/miru/v1/<id>` | por canal privado | _(nombre + correo)_ |
| Effi       | pendiente | _(se asigna)_   | `https://api.miruecommerce.pro/webhooks/miru/v1/<id>` | por canal privado | _(nombre + correo)_ |

## Canales de prueba actuales (datos demo)

Sirven para el sandbox hasta que se cree cada conexión real:

| Plataforma | `connection_id` de prueba              |
| ---------- | -------------------------------------- |
| Dropi      | `55555555-5555-5555-5555-555555555555` |
| MasterShop | `66666666-6666-6666-6666-666666666666` |
| Effi       | `77777777-7777-7777-7777-777777777777` |

> Estos IDs y el secreto de demo se eliminan cuando se carguen los datos reales.

## Contacto de Miru para las plataformas

| Rol                | Dato                       |
| ------------------ | -------------------------- |
| Responsable        | _(nombre)_                 |
| Correo técnico     | _(correo)_                 |
| Horario de soporte | _(zona horaria / horario)_ |
