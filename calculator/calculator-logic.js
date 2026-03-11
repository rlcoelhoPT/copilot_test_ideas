'use strict';

/**
 * Pure calculator logic — no DOM dependencies.
 * Exported for both browser (window.CalculatorLogic) and Node/Jest (module.exports).
 */

const MAX_DIGITS = 8;
const MAX_DECIMAL_PLACES = 3;

class CalculatorLogic {
  constructor() {
    this.reset();
  }

  reset() {
    this.displayValue = '0';
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
    this.hasError = false;
  }

  // C — clear last number or last operator
  clearLast() {
    if (this.hasError) {
      this.reset();
      return;
    }
    if (this.waitingForSecondOperand) {
      // Last entry was an operator — undo it, restore first operand to display
      this.displayValue = this._formatDisplay(this.firstOperand);
      this.operator = null;
      this.waitingForSecondOperand = false;
    } else {
      this.displayValue = '0';
    }
  }

  // AC — clear everything
  clearAll() {
    this.reset();
  }

  inputDigit(digit) {
    if (this.hasError) return;

    const d = String(digit);

    if (this.waitingForSecondOperand) {
      this.displayValue = d;
      this.waitingForSecondOperand = false;
      return;
    }

    const currentDigits = this.displayValue.replace(/[^0-9]/g, '').length;
    if (currentDigits >= MAX_DIGITS) return; // ignore extra digits

    this.displayValue =
      this.displayValue === '0' ? d : this.displayValue + d;
  }

  inputDecimal() {
    if (this.hasError) return;

    if (this.waitingForSecondOperand) {
      this.displayValue = '0.';
      this.waitingForSecondOperand = false;
      return;
    }

    if (this.displayValue.includes('.')) return; // already has decimal

    const currentDigits = this.displayValue.replace(/[^0-9]/g, '').length;
    if (currentDigits >= MAX_DIGITS) return;

    this.displayValue += '.';
  }

  toggleSign() {
    if (this.hasError) return;
    if (this.displayValue === '0') return;

    if (this.displayValue.startsWith('-')) {
      this.displayValue = this.displayValue.slice(1);
    } else {
      this.displayValue = '-' + this.displayValue;
    }
  }

  handleOperator(nextOperator) {
    if (this.hasError) return;

    const inputValue = parseFloat(this.displayValue);

    // If user enters two operators in a row, just swap the operator
    if (this.waitingForSecondOperand) {
      this.operator = nextOperator;
      return;
    }

    if (this.firstOperand === null) {
      this.firstOperand = inputValue;
    } else if (this.operator) {
      const result = this._calculate(
        this.firstOperand,
        inputValue,
        this.operator
      );
      if (result === null) {
        this.displayValue = 'ERR';
        this.hasError = true;
        return;
      }
      this.displayValue = this._formatDisplay(result);
      this.firstOperand = result;
    }

    this.waitingForSecondOperand = true;
    this.operator = nextOperator;
  }

  equals() {
    if (this.hasError) return;
    if (this.operator === null) return;

    const inputValue = parseFloat(this.displayValue);
    const result = this._calculate(
      this.firstOperand,
      inputValue,
      this.operator
    );

    if (result === null) {
      this.displayValue = 'ERR';
      this.hasError = true;
      return;
    }

    this.displayValue = this._formatDisplay(result);
    this.firstOperand = null;
    this.operator = null;
    this.waitingForSecondOperand = false;
  }

  // ── private helpers ──────────────────────────────────────────────────────

  _calculate(first, second, operator) {
    let result;
    switch (operator) {
      case '+': result = first + second; break;
      case '-': result = first - second; break;
      case '*': result = first * second; break;
      case '/':
        if (second === 0) return null; // division by zero → ERR
        result = first / second;
        break;
      default:
        return second;
    }

    // Round to at most MAX_DECIMAL_PLACES places to avoid float noise
    result = parseFloat(result.toFixed(MAX_DECIMAL_PLACES));

    // Overflow check — integer portion must not exceed MAX_DIGITS digits
    const integerPart = String(Math.trunc(Math.abs(result)));
    if (integerPart.length > MAX_DIGITS) return null;

    return result;
  }

  _formatDisplay(value) {
    const s = String(value);
    // Trim trailing zeros after decimal but keep it readable
    return s;
  }
}

// Support both browser (via <script>) and Node/Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CalculatorLogic, MAX_DIGITS, MAX_DECIMAL_PLACES };
} else {
  window.CalculatorLogic = CalculatorLogic;
}
