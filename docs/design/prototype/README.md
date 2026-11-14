# Prototipo de diseño

Aquí va el **código exportado del prototipo** cuando exista (el plan P8a lo pedía y todavía no
se entregó).

Estado actual:

- La **fuente de verdad visual** es la propia aplicación en `apps/web` (componentes en
  `apps/web/components/`, tokens en `apps/web/app/globals.css`).
- Los artefactos derivados de ese código son [`../tokens.json`](../tokens.json),
  [`../theme.css`](../theme.css), [`../DESIGN-SYSTEM.md`](../DESIGN-SYSTEM.md) y
  [`../UX-SPEC.md`](../UX-SPEC.md).

Si llega el prototipo (Figma exportado, HTML estático o código de Stitch):

1. Guardarlo en esta carpeta, sin dependencias que rompan el monorepo.
2. No importarlo desde `apps/web`: es referencia, no código de producción.
3. Si difiere del sistema documentado, abrir la decisión antes de cambiar la UI.
