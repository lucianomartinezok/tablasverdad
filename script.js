/*
 Aplicación: Generador de Tablas de Verdad (Lógica proposicional)
 Autor: Asistente IA
 Descripción general:
 - Interfaz tipo calculadora: botones de variables, operadores y paréntesis construyen la expresión.
 - Flujo: normalización → extracción de variables → combinaciones → parsing (Shunting-Yard) → evaluación postfija → render.
 - Operadores soportados: ¬ (NOT), ∧ (AND), ∨ (OR), ⊕ (XOR), → (Implica), ↔ (Bicondicional).
 - Alias aceptados en entrada: and/& , or/| , not/! , xor/^ , -> , <-> / <=> .
 - El teclado está bloqueado a propósito; se ingresa sólo con botones para evitar símbolos inválidos.
 - Límite: hasta 10 variables entre p..y.

 Nota de mantenimiento:
 - Si agregas nuevas variables u operadores, actualiza `this.variables`, `this.operators`, `normalizeExpression`, `applyOperator` y la UI de botones.
 - `generateSubexpressions` intenta extraer subexpresiones útiles para mostrar columnas intermedias; es heurístico.
*/

// Clase principal para el generador de tablas de verdad
class TruthTableGenerator {
    constructor() {
        this.variables = ['p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y'];
        this.operators = {
            '∧': { precedence: 3, associativity: 'left', name: 'AND' },
            '∨': { precedence: 2, associativity: 'left', name: 'OR' },
            '⊕': { precedence: 2, associativity: 'left', name: 'XOR' },
            '→': { precedence: 1, associativity: 'right', name: 'Implicación' },
            '↔': { precedence: 1, associativity: 'left', name: 'Bicondicional' },
            '¬': { precedence: 4, associativity: 'right', name: 'NOT' }
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const generateBtn = document.getElementById('generate-btn');
        const backspaceBtn = document.getElementById('backspace-btn');
        const clearBtn = document.getElementById('clear-btn');
        const expressionDisplay = document.getElementById('expression-display');

        // Botones de control
        generateBtn.addEventListener('click', () => this.generateTable());
        backspaceBtn.addEventListener('click', () => this.backspace());
        clearBtn.addEventListener('click', () => this.clearExpression());

        // Botones de variables
        document.querySelectorAll('.variable-btn').forEach(btn => {
            btn.addEventListener('click', () => this.addCharacter(btn.dataset.char));
        });

        // Botones de operadores
        document.querySelectorAll('.operator-btn').forEach(btn => {
            btn.addEventListener('click', () => this.addCharacter(btn.dataset.char));
        });

        // Botones de paréntesis
        document.querySelectorAll('.parenthesis-btn').forEach(btn => {
            btn.addEventListener('click', () => this.addCharacter(btn.dataset.char));
        });

        // Deshabilitar teclado
        document.addEventListener('keydown', (e) => {
            e.preventDefault();
        });

        // Inicializar expresión vacía
        this.currentExpression = '';
        this.updateDisplay();
    }

    /**
     * Agrega un carácter (variable, operador o paréntesis) a la expresión en curso.
     * @param {string} char
     */
    addCharacter(char) {
        this.currentExpression += char;
        this.updateDisplay();
    }

    backspace() {
        if (this.currentExpression.length > 0) {
            this.currentExpression = this.currentExpression.slice(0, -1);
            this.updateDisplay();
        }
    }

    clearExpression() {
        this.currentExpression = '';
        this.updateDisplay();
    }

    updateDisplay() {
        const expressionDisplay = document.getElementById('expression-display');

        if (this.currentExpression.length === 0) {
            expressionDisplay.innerHTML = '<span class="placeholder-text">Usa los botones para construir tu expresión</span>';
        } else {
            expressionDisplay.innerHTML = `<span class="expression-content">${this.currentExpression}</span>`;
        }
    }

    generateTable() {
        const expression = this.currentExpression.trim();

        if (!expression) {
            this.showError('Por favor, construye una expresión lógica usando los botones.');
            return;
        }

        try {
            // Limpiar y normalizar la expresión
            const normalizedExpression = this.normalizeExpression(expression);

            // Extraer variables de la expresión
            const usedVariables = this.extractVariables(normalizedExpression);

            if (usedVariables.length === 0) {
                this.showError('No se encontraron variables válidas en la expresión.');
                return;
            }

            if (usedVariables.length > 10) {
                this.showError('Máximo 10 variables permitidas.');
                return;
            }

            // Generar todas las combinaciones de valores de verdad
            const combinations = this.generateCombinations(usedVariables.length);

            // Generar subexpresiones paso a paso
            const subexpressions = this.generateSubexpressions(normalizedExpression, usedVariables);

            // Evaluar la expresión para cada combinación
            const results = combinations.map(combination => {
                const variableValues = {};
                usedVariables.forEach((variable, index) => {
                    variableValues[variable] = combination[index];
                });

                const result = this.evaluateExpression(normalizedExpression, variableValues);
                return [...combination, result];
            });

            // Mostrar la tabla
            this.displayTable(usedVariables, results, subexpressions, normalizedExpression);
            this.hideError();

        } catch (error) {
            this.showError(`Error en la expresión: ${error.message}`);
        }
    }

    /**
     * Sustituye alias y normaliza paréntesis/espacios, devolviendo una expresión lista para parsear.
     * @param {string} expression
     * @returns {string}
     */
    normalizeExpression(expression) {
        // Reemplazar diferentes tipos de paréntesis
        let normalized = expression
            .replace(/\[/g, '(')
            .replace(/\]/g, ')')
            .replace(/\{/g, '(')
            .replace(/\}/g, ')')
            .replace(/\s+/g, ''); // Eliminar espacios

        // Normalizar letras a minúsculas para permitir entrada en mayúsculas
        normalized = normalized.toLowerCase();

        // Reemplazar operadores alternativos
        normalized = normalized
            .replace(/and/gi, '∧')
            .replace(/or/gi, '∨')
            .replace(/not/gi, '¬')
            .replace(/xor/gi, '⊕')
            .replace(/->/g, '→')
            .replace(/<->/g, '↔')
            .replace(/<=>/g, '↔')
            .replace(/&/g, '∧')
            .replace(/\|/g, '∨')
            .replace(/!/g, '¬')
            .replace(/\^/g, '⊕');

        return normalized;
    }

    /**
     * Obtiene el conjunto ordenado de variables presentes en la expresión (p..y).
     * @param {string} expression
     * @returns {string[]}
     */
    extractVariables(expression) {
        const variableSet = new Set();
        const variablePattern = /[a-z]/g;
        let match;

        while ((match = variablePattern.exec(expression)) !== null) {
            const variable = match[0];
            if (this.variables.includes(variable)) {
                variableSet.add(variable);
            }
        }

        return Array.from(variableSet).sort();
    }

    /**
     * Genera todas las combinaciones booleanas para n variables en orden lexicográfico descendente.
     * @param {number} numVariables
     * @returns {boolean[][]}
     */
    generateCombinations(numVariables) {
        const combinations = [];
        const totalCombinations = Math.pow(2, numVariables);

        // Generar combinaciones en orden inverso para empezar con todas V
        for (let i = totalCombinations - 1; i >= 0; i--) {
            const combination = [];
            for (let j = numVariables - 1; j >= 0; j--) {
                combination.push((i >> j) & 1 ? true : false);
            }
            combinations.push(combination);
        }

        return combinations;
    }

    /**
     * Evalúa una expresión infija para un mapa de valores de variables.
     * Internamente convierte a notación postfija (Shunting-Yard) y evalúa con una pila.
     * @param {string} expression
     * @param {Record<string, boolean>} variableValues
     * @returns {boolean}
     */
    evaluateExpression(expression, variableValues) {
        try {
            // Convertir a notación postfija usando el algoritmo shunting yard
            const postfix = this.infixToPostfix(expression);

            // Evaluar la expresión postfija
            return this.evaluatePostfix(postfix, variableValues);
        } catch (error) {
            throw new Error(`Error al evaluar la expresión: ${error.message}`);
        }
    }

    /**
     * Convierte una expresión infija a postfija (RPN) usando Shunting-Yard.
     * Respeta precedencias y asociatividades declaradas en `this.operators`.
     * @param {string} expression
     * @returns {string[]}
     */
    infixToPostfix(expression) {
        const output = [];
        const operators = [];
        let i = 0;

        while (i < expression.length) {
            const char = expression[i];

            if (this.variables.includes(char)) {
                output.push(char);
            } else if (char === '¬') {
                operators.push(char);
            } else if (char in this.operators) {
                while (operators.length > 0 &&
                    operators[operators.length - 1] !== '(' &&
                    this.operators[operators[operators.length - 1]].precedence >= this.operators[char].precedence) {
                    output.push(operators.pop());
                }
                operators.push(char);
            } else if (char === '(') {
                operators.push(char);
            } else if (char === ')') {
                while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop());
                }
                if (operators.length === 0) {
                    throw new Error('Paréntesis no balanceados');
                }
                operators.pop(); // Remover '('
            }
            i++;
        }

        while (operators.length > 0) {
            if (operators[operators.length - 1] === '(') {
                throw new Error('Paréntesis no balanceados');
            }
            output.push(operators.pop());
        }

        return output;
    }

    /**
     * Evalúa una lista de tokens en notación postfija con una pila booleana.
     * @param {string[]} postfix
     * @param {Record<string, boolean>} variableValues
     * @returns {boolean}
     */
    evaluatePostfix(postfix, variableValues) {
        const stack = [];

        for (const token of postfix) {
            if (this.variables.includes(token)) {
                stack.push(variableValues[token]);
            } else if (token === '¬') {
                if (stack.length === 0) {
                    throw new Error('Operador NOT sin operando');
                }
                const operand = stack.pop();
                stack.push(!operand);
            } else if (token in this.operators) {
                if (stack.length < 2) {
                    throw new Error(`Operador ${token} necesita dos operandos`);
                }
                const right = stack.pop();
                const left = stack.pop();
                stack.push(this.applyOperator(token, left, right));
            }
        }

        if (stack.length !== 1) {
            throw new Error('Expresión inválida');
        }

        return stack[0];
    }

    /**
     * Aplica un operador binario sobre operandos booleanos.
     * @param {string} operator
     * @param {boolean} left
     * @param {boolean} right
     * @returns {boolean}
     */
    applyOperator(operator, left, right) {
        switch (operator) {
            case '∧': return left && right;
            case '∨': return left || right;
            case '⊕': return left !== right;
            case '→': return !left || right;
            case '↔': return left === right;
            default: throw new Error(`Operador desconocido: ${operator}`);
        }
    }

    /**
     * Heurística para listar subexpresiones relevantes que se muestran como columnas intermedias.
     * No reemplaza un parser completo de subárboles, pero cubre casos comunes.
     * @param {string} expression
     * @param {string[]} variables
     * @returns {string[]}
     */
    generateSubexpressions(expression, variables) {
        const result = [];
        const seen = new Set();

        const precedence = (op) => {
            if (op === '¬') return 4;
            if (op === '∧') return 3;
            if (op === '∨' || op === '⊕') return 2;
            if (op === '→' || op === '↔') return 1;
            return 0;
        };

        const trimOuterParens = (expr) => {
            let e = expr;
            while (e.length > 1 && e[0] === '(' && e[e.length - 1] === ')') {
                let depth = 0;
                let balanced = true;
                for (let i = 0; i < e.length - 1; i++) {
                    if (e[i] === '(') depth++;
                    else if (e[i] === ')') depth--;
                    if (depth === 0 && i < e.length - 1) {
                        balanced = false;
                        break;
                    }
                }
                if (!balanced) break;
                e = e.substring(1, e.length - 1);
            }
            return e;
        };

        const add = (expr) => {
            const e = trimOuterParens(expr);
            if (!seen.has(e) && e.length > 0) {
                seen.add(e);
                result.push(e);
            }
        };

        const splitTopLevelByLowestPrecedence = (expr) => {
            let depth = 0;
            let best = { index: -1, op: null, prec: Infinity };
            for (let i = 0; i < expr.length; i++) {
                const ch = expr[i];
                if (ch === '(') depth++;
                else if (ch === ')') depth--;
                else if (depth === 0 && (ch in this.operators)) {
                    const p = precedence(ch);
                    if (p < best.prec) {
                        best = { index: i, op: ch, prec: p };
                    }
                }
            }
            return best.index !== -1 ? best : null;
        };

        const walk = (expr) => {
            const e = trimOuterParens(expr);
            if (e.length === 0) return;

            // 1) Intentar dividir por operador binario de menor precedencia a nivel superior
            const split = splitTopLevelByLowestPrecedence(e);
            if (split && split.op) {
                const left = e.substring(0, split.index);
                const right = e.substring(split.index + 1);

                // Registrar operandos y la composición
                walk(left);
                walk(right);
                add(left + split.op + right);
                return;
            }

            // 2) Si no hay operador binario a nivel superior, manejar negación unaria al inicio
            if (e[0] === '¬') {
                const operand = e.substring(1);
                walk(operand);
                add('¬' + trimOuterParens(operand));
                return;
            }

            // 3) Si es una sola variable o grupo sin más operadores, no hacer nada extra
            if (e.length === 1 && variables.includes(e)) return;
        };

        // Iniciar recorrido desde la expresión completa
        walk(expression);

        // Orden: por longitud y posición de aparición en la expresión original
        result.sort((a, b) => {
            if (a.length !== b.length) return a.length - b.length;
            return expression.indexOf(a) - expression.indexOf(b);
        });

        // Asegurar que la expresión completa aparezca al final
        if (!seen.has(expression)) result.push(expression);
        else {
            // Moverla al final si ya estaba
            const idx = result.indexOf(expression);
            if (idx !== -1) {
                result.splice(idx, 1);
                result.push(expression);
            }
        }

        return result;
    }

    isInsideParentheses(expr, index) {
        let depth = 0;
        for (let i = 0; i < index; i++) {
            if (expr[i] === '(') depth++;
            else if (expr[i] === ')') depth--;
        }
        return depth > 0;
    }

    findLeftOperand(expr, opIndex, variables) {
        let start = opIndex - 1;

        // Si el carácter anterior es ')', buscar el paréntesis correspondiente
        if (expr[start] === ')') {
            let depth = 1;
            start--;
            while (start >= 0 && depth > 0) {
                if (expr[start] === ')') depth++;
                else if (expr[start] === '(') depth--;
                start--;
            }
            start++; // Ajustar para incluir el '('
        } else if (variables.includes(expr[start])) {
            // Si es una variable, buscar el inicio
            while (start >= 0 && variables.includes(expr[start])) {
                start--;
            }
            start++;
        } else if (expr[start] === '¬') {
            // Si es una negación, buscar el operando
            start--;
            if (start >= 0 && variables.includes(expr[start])) {
                while (start >= 0 && variables.includes(expr[start])) {
                    start--;
                }
                start++;
            }
        }

        return expr.substring(start, opIndex);
    }

    findRightOperand(expr, opIndex, variables) {
        let end = opIndex + 1;

        // Si el carácter siguiente es '(', buscar el paréntesis correspondiente
        if (expr[end] === '(') {
            let depth = 1;
            end++;
            while (end < expr.length && depth > 0) {
                if (expr[end] === '(') depth++;
                else if (expr[end] === ')') depth--;
                end++;
            }
        } else if (expr[end] === '¬') {
            // Si es una negación, buscar el operando
            end++;
            if (end < expr.length && variables.includes(expr[end])) {
                while (end < expr.length && variables.includes(expr[end])) {
                    end++;
                }
            }
        } else if (variables.includes(expr[end])) {
            // Si es una variable, buscar el final
            while (end < expr.length && variables.includes(expr[end])) {
                end++;
            }
        }

        return expr.substring(opIndex + 1, end);
    }

    /**
     * Renderiza la tabla de verdad y el encabezado (variables + subexpresiones + expresión total).
     * @param {string[]} variables
     * @param {Array<(boolean)[]>} results
     * @param {string[]} subexpressions
     * @param {string} expression
     */
    displayTable(variables, results, subexpressions, expression) {
        const resultSection = document.getElementById('result-section');
        const truthTable = document.getElementById('truth-table');
        const variableCount = document.getElementById('variable-count');
        const rowCount = document.getElementById('row-count');

        // Limpiar tabla anterior
        truthTable.innerHTML = '';

        // Crear encabezados
        const headerRow = document.createElement('tr');

        // Variables
        variables.forEach(variable => {
            const th = document.createElement('th');
            th.textContent = variable;
            th.style.background = 'var(--bg-dark)';
            headerRow.appendChild(th);
        });

        // Subexpresiones
        subexpressions.forEach(subexpr => {
            const th = document.createElement('th');
            th.textContent = subexpr;
            th.style.background = 'var(--primary-color)';
            headerRow.appendChild(th);
        });

        truthTable.appendChild(headerRow);

        // Crear filas de datos
        results.forEach((result, rowIndex) => {
            const row = document.createElement('tr');

            // Variables
            variables.forEach((variable, varIndex) => {
                const td = document.createElement('td');
                const span = document.createElement('span');
                span.className = `truth-value ${result[varIndex] ? 'true' : 'false'}`;
                span.textContent = result[varIndex] ? 'V' : 'F';
                td.appendChild(span);
                row.appendChild(td);
            });

            // Subexpresiones
            const variableValues = {};
            variables.forEach((variable, index) => {
                variableValues[variable] = result[index];
            });

            subexpressions.forEach(subexpr => {
                const td = document.createElement('td');
                try {
                    const value = this.evaluateExpression(subexpr, variableValues);
                    const span = document.createElement('span');
                    span.className = `truth-value ${value ? 'true' : 'false'}`;
                    span.textContent = value ? 'V' : 'F';
                    td.appendChild(span);
                } catch (error) {
                    td.textContent = '?';
                    td.style.color = 'var(--error-color)';
                }
                row.appendChild(td);
            });

            truthTable.appendChild(row);
        });

        // Actualizar información
        variableCount.textContent = `${variables.length} variable${variables.length !== 1 ? 's' : ''}`;
        rowCount.textContent = `${results.length} combinación${results.length !== 1 ? 'es' : ''} • ${subexpressions.length} subexpresión${subexpressions.length !== 1 ? 'es' : ''}`;

        // Mostrar sección de resultados
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    showError(message) {
        const errorSection = document.getElementById('error-section');
        const errorMessage = document.getElementById('error-message');

        errorMessage.textContent = message;
        errorSection.style.display = 'block';

        // Ocultar sección de resultados si está visible
        const resultSection = document.getElementById('result-section');
        resultSection.style.display = 'none';
    }

    hideError() {
        const errorSection = document.getElementById('error-section');
        errorSection.style.display = 'none';
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new TruthTableGenerator();
});

// Ejemplos de expresiones para mostrar en el placeholder
const exampleExpressions = [
    '(p ∧ q) ∨ (¬r → s)',
    'p ∧ (q ∨ r)',
    '(p → q) ↔ (¬q → ¬p)',
    'p ⊕ q ⊕ r',
    '¬(p ∧ q) ∨ (p ∨ q)'
];

// Cambiar el placeholder dinámicamente
let currentExampleIndex = 0;
setInterval(() => {
    const expressionDisplay = document.getElementById('expression-display');
    if (expressionDisplay.querySelector('.placeholder-text')) {
        expressionDisplay.innerHTML = `<span class="placeholder-text">Ej: ${exampleExpressions[currentExampleIndex]}</span>`;
        currentExampleIndex = (currentExampleIndex + 1) % exampleExpressions.length;
    }
}, 3000);
