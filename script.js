const resultDisplay = document.querySelector("#result");
const historyDisplay = document.querySelector("#history");
const keys = document.querySelector(".keys");

let currentValue = "0";
let storedValue = null;
let operator = null;
let waitingForOperand = false;
let historyText = "";

const operatorSymbols = {
  "+": "+",
  "-": "−",
  "*": "×",
  "/": "÷",
};

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";

  return Number.parseFloat(value.toPrecision(12)).toString();
}

function updateDisplay() {
  resultDisplay.value = currentValue;

  if (storedValue !== null && operator) {
    historyDisplay.textContent = `${storedValue} ${operatorSymbols[operator]}`;
  } else if (historyText) {
    historyDisplay.textContent = historyText;
  } else {
    historyDisplay.innerHTML = "&nbsp;";
  }
}

function inputNumber(number) {
  if (currentValue === "Error" || waitingForOperand) {
    if (storedValue === null && operator === null) historyText = "";
    currentValue = number;
    waitingForOperand = false;
  } else if (currentValue.length < 14) {
    currentValue = currentValue === "0" ? number : currentValue + number;
  }
}

function inputDecimal() {
  if (currentValue === "Error" || waitingForOperand) {
    if (storedValue === null && operator === null) historyText = "";
    currentValue = "0.";
    waitingForOperand = false;
  } else if (!currentValue.includes(".")) {
    currentValue += ".";
  }
}

function calculate(left, right, selectedOperator) {
  switch (selectedOperator) {
    case "+": return left + right;
    case "-": return left - right;
    case "*": return left * right;
    case "/": return right === 0 ? Number.NaN : left / right;
    default: return right;
  }
}

function chooseOperator(nextOperator) {
  const inputValue = Number.parseFloat(currentValue);

  if (!Number.isFinite(inputValue)) {
    clearCalculator();
    return;
  }

  if (operator && waitingForOperand) {
    operator = nextOperator;
  } else if (storedValue === null) {
    historyText = "";
    storedValue = inputValue;
  } else if (operator) {
    const result = calculate(storedValue, inputValue, operator);
    currentValue = formatNumber(result);
    storedValue = currentValue === "Error" ? null : Number.parseFloat(currentValue);
  }

  operator = currentValue === "Error" ? null : nextOperator;
  waitingForOperand = true;
}

function equals() {
  if (operator === null || storedValue === null || waitingForOperand) return;

  const rightValue = Number.parseFloat(currentValue);
  const expression = `${storedValue} ${operatorSymbols[operator]} ${rightValue} =`;
  currentValue = formatNumber(calculate(storedValue, rightValue, operator));
  historyText = expression;
  storedValue = null;
  operator = null;
  waitingForOperand = true;
}

function clearCalculator() {
  currentValue = "0";
  storedValue = null;
  operator = null;
  waitingForOperand = false;
  historyText = "";
}

function deleteDigit() {
  if (waitingForOperand || currentValue === "Error") return;
  currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : "0";
}

function percent() {
  if (currentValue === "Error") return;
  currentValue = formatNumber(Number.parseFloat(currentValue) / 100);
}

function handleAction(target) {
  if (target.dataset.number !== undefined) inputNumber(target.dataset.number);
  if (target.dataset.operator) chooseOperator(target.dataset.operator);
  if (target.dataset.action === "decimal") inputDecimal();
  if (target.dataset.action === "equals") equals();
  if (target.dataset.action === "clear") clearCalculator();
  if (target.dataset.action === "delete") deleteDigit();
  if (target.dataset.action === "percent") percent();
  updateDisplay();
}

keys.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button) handleAction(button);
});

document.addEventListener("keydown", (event) => {
  const keyMap = {
    Enter: '[data-action="equals"]',
    "=": '[data-action="equals"]',
    Escape: '[data-action="clear"]',
    Backspace: '[data-action="delete"]',
    ".": '[data-action="decimal"]',
    "%": '[data-action="percent"]',
    "+": '[data-operator="+"]',
    "-": '[data-operator="-"]',
    "*": '[data-operator="*"]',
    "/": '[data-operator="/"]',
  };

  const selector = /^\d$/.test(event.key)
    ? `[data-number="${event.key}"]`
    : keyMap[event.key];

  if (!selector) return;

  event.preventDefault();
  const button = document.querySelector(selector);
  handleAction(button);
  button.classList.add("is-active");
  window.setTimeout(() => button.classList.remove("is-active"), 100);
});

updateDisplay();
