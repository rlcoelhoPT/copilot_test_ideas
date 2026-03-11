'use strict';

(function () {
  const calc = new CalculatorLogic();

  const displayEl  = document.getElementById('js-display');
  const operatorEl = document.getElementById('js-operator');

  const OPERATOR_LABELS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  function updateDisplay() {
    displayEl.textContent = calc.displayValue;
    displayEl.classList.toggle('display__value--error', calc.hasError);

    // Show pending operator in the small indicator row
    operatorEl.textContent = calc.operator
      ? OPERATOR_LABELS[calc.operator] ?? calc.operator
      : '';

    // Highlight the active operator button
    document.querySelectorAll('.btn--op').forEach((btn) => {
      btn.classList.toggle(
        'is-active',
        !calc.hasError &&
          calc.waitingForSecondOperand &&
          btn.dataset.value === calc.operator
      );
    });
  }

  function handleButtonClick(event) {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const value  = btn.dataset.value;

    switch (action) {
      case 'digit':       calc.inputDigit(value);         break;
      case 'decimal':     calc.inputDecimal();             break;
      case 'operator':    calc.handleOperator(value);      break;
      case 'equals':      calc.equals();                   break;
      case 'clear-last':  calc.clearLast();                break;
      case 'clear-all':   calc.clearAll();                 break;
      case 'toggle-sign': calc.toggleSign();               break;
    }

    updateDisplay();
  }

  // Keyboard support
  function handleKeyDown(event) {
    const key = event.key;

    if (key >= '0' && key <= '9') { calc.inputDigit(key); }
    else if (key === '.')          { calc.inputDecimal(); }
    else if (key === '+')          { calc.handleOperator('+'); }
    else if (key === '-')          { calc.handleOperator('-'); }
    else if (key === '*')          { calc.handleOperator('*'); }
    else if (key === '/')          { event.preventDefault(); calc.handleOperator('/'); }
    else if (key === 'Enter' || key === '=') { calc.equals(); }
    else if (key === 'Backspace')  { calc.clearLast(); }
    else if (key === 'Escape')     { calc.clearAll(); }
    else return; // no match — skip updateDisplay

    updateDisplay();
  }

  document.querySelector('.keypad').addEventListener('click', handleButtonClick);
  document.addEventListener('keydown', handleKeyDown);

  updateDisplay(); // initial render
})();
