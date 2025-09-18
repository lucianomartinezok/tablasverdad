# Generador de Tablas de Verdad

Versión: 1.1 (18/09/2025)

Aplicación web para construir expresiones de lógica proposicional y generar su tabla de verdad paso a paso.

## Características
- Construcción de expresiones con botones (teclado deshabilitado para evitar errores).
- Normalización automática de alias y paréntesis.
- Soporta operadores: ¬ (NOT), ∧ (AND), ∨ (OR), ⊕ (XOR), → (Implica), ↔ (Bicondicional).
- Alias admitidos: `and`/`&`, `or`/`|`, `not`/`!`, `xor`/`^`, `->`, `<->`/`<=>`.
- Muestra subexpresiones intermedias como columnas adicionales para seguimiento.
- Hasta 10 variables permitidas: `p`..`y`.

## Uso
1. Abre `index.html` en tu navegador.
2. Usa los botones de Variables, Operadores y Paréntesis para construir la expresión.
3. Pulsa "Generar Tabla" para ver la tabla de verdad.
4. Usa "Borrar" para eliminar el último carácter o "Limpiar" para empezar de cero.

Ejemplos de expresiones válidas:
- `(p ∧ q) ∨ (¬r → s)`
- `p ∧ (q ∨ r)`
- `(p → q) ↔ (¬q → ¬p)`
- `p ⊕ q ⊕ r`
- `¬(p ∧ q) ∨ (p ∨ q)`

## Estructura del proyecto
- `index.html`: Estructura de la UI y secciones de resultados/errores.
- `styles.css`: Estilos, paleta y responsivo.
- `script.js`: Lógica de normalización, parsing (Shunting-Yard), evaluación y render.

## Notas técnicas
- Parsing: Se convierte la expresión infija a postfija respetando precedencia y asociatividad, luego se evalúa con una pila.
- Subexpresiones: Se extraen heurísticamente para visualizar pasos intermedios. No sustituye un AST completo pero cubre casos comunes.

## Mantenimiento / Extensiones
Si agregas un operador nuevo:
1. Añade su entrada en `this.operators` (precedencia y asociatividad) en `script.js`.
2. Actualiza `normalizeExpression` para aceptar alias (si aplica).
3. Implementa el caso en `applyOperator`.
4. Agrega el botón en `index.html` y estilos si necesita variante.

Si agregas nuevas variables:
1. Añádelas en `this.variables`.
2. Considera el impacto en rendimiento: filas = 2^n.

## Limitaciones conocidas
- El teclado está deshabilitado a propósito; todo se ingresa con botones.
- Las subexpresiones se extraen de forma heurística y pueden omitir casos muy anidados o atípicos.

## Licencia
Uso personal/educativo.

## Changelog

- 1.1 (18/09/2025)
  - Normalización de mayúsculas para variables (acepta P, Q, ...).
  - Reescritura de generación de subexpresiones: ahora divide por el operador de menor precedencia a nivel superior (p. ej. ↔) y garantiza columnas intermedias como `¬p`, `¬p∨q`, `p→q`.
  - Corrección del orden de análisis: se prioriza detectar el operador binario tope antes de tratar negaciones, evitando errores en expresiones como `¬(p∨q)↔(¬p∧¬q)`.
  - Comentarios JSDoc y notas de mantenimiento en `script.js`; comentarios de estructura en `index.html`; cabecera descriptiva en `styles.css`.
  - Indicador de versión y fecha en el footer de `index.html`.


