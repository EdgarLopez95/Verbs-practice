Reglas obligatorias para este proyecto (Verb Flow):
- Mobile-first: todo debe verse perfecto primero en 360×800 aprox.
- Stack: HTML/CSS/JS vanilla (sin frameworks) + compatible con GitHub Pages.
- Navegación: SPA por secciones (mostrar/ocultar), NO rutas reales (evitar 404 en GH Pages).
- UX: no pedir login al inicio. La app SIEMPRE arranca en modo Guest.
- Practice: no se avanza al siguiente verbo si no está correcto. Hint cuenta como incorrecto.
- Accesibilidad: botones/tap targets ≥ 48px alto, contraste alto, inputs con labels.
- Performance: sin librerías pesadas; carga del JSON una sola vez.
- Entregables por etapa: Cursor debe entregar “archivos modificados + checklist” y NO inventarse pasos omitidos.

# Arquitectura obligatoria del proyecto

A partir de ahora, toda nueva lógica debe respetar esta estructura:

/src
  /app
  /features
  /services
  /shared
  /styles

Reglas:

- No crear lógica nueva en la raíz del proyecto.
- No centralizar toda la lógica en un solo archivo.
- Cada feature debe vivir dentro de /src/features.
- Servicios externos (dataset, firebase) deben vivir en /src/services.
- Utilidades reutilizables deben ir en /src/shared/utils.
- Componentes UI reutilizables deben ir en /src/shared/components.
- La app debe usar ES Modules (type="module") para importar/exportar.

Si una instrucción entra en conflicto con esta arquitectura, priorizar esta arquitectura.