const resultDisplay = document.querySelector("#result");
const historyDisplay = document.querySelector("#history");
const keys = document.querySelector(".keys");
const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');
const styleOptions = document.querySelectorAll("[data-style-option]");
const calculatorName = document.querySelector("#calculator-name");
const displayStatus = document.querySelector("#display-status");

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
let hasSavedTheme = false;

const styleDetails = {
  nexus: {
    name: "Nexus",
    status: "SYS / READY",
    lightThemeColor: "#e9edef",
    darkThemeColor: "#050908",
  },
  aegis: {
    name: "Aegis",
    status: "RUNES / READY",
    lightThemeColor: "#d8c6a7",
    darkThemeColor: "#0e0906",
  },
  mochi: {
    name: "Mochi",
    status: "SWEET / READY",
    lightThemeColor: "#fff0f6",
    darkThemeColor: "#190d17",
  },
};

function getSavedStyle() {
  try {
    const savedStyle = window.localStorage.getItem("calculator-style");
    return styleDetails[savedStyle] ? savedStyle : "nexus";
  } catch {
    return "nexus";
  }
}

function updateThemeColor() {
  const style = document.documentElement.dataset.style || "nexus";
  const isDark = document.documentElement.dataset.theme === "dark";
  themeColor.content = isDark
    ? styleDetails[style].darkThemeColor
    : styleDetails[style].lightThemeColor;
}

function applyStyle(style, savePreference = false) {
  const selectedStyle = styleDetails[style] ? style : "nexus";
  const details = styleDetails[selectedStyle];

  document.documentElement.dataset.style = selectedStyle;
  calculatorName.textContent = details.name;
  displayStatus.textContent = details.status;
  document.title = `${details.name} Calculator`;

  styleOptions.forEach((option) => {
    const isSelected = option.dataset.styleOption === selectedStyle;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-pressed", String(isSelected));
  });

  updateThemeColor();

  if (savePreference) {
    try {
      window.localStorage.setItem("calculator-style", selectedStyle);
    } catch {
      // The selected style still applies when storage is unavailable.
    }
  }
}

function getSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem("calculator-theme");
    hasSavedTheme = savedTheme === "light" || savedTheme === "dark";
    return hasSavedTheme ? savedTheme : null;
  } catch {
    return null;
  }
}

function applyTheme(theme, savePreference = false) {
  const isDark = theme === "dark";

  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-checked", String(isDark));
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
  updateThemeColor();

  if (savePreference) {
    hasSavedTheme = true;
    try {
      window.localStorage.setItem("calculator-theme", isDark ? "dark" : "light");
    } catch {
      // The selected theme still applies when storage is unavailable.
    }
  }
}

applyStyle(getSavedStyle());
applyTheme(getSavedTheme() ?? (systemTheme.matches ? "dark" : "light"));

styleOptions.forEach((option) => {
  option.addEventListener("click", () => applyStyle(option.dataset.styleOption, true));
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
});

systemTheme.addEventListener("change", (event) => {
  if (!hasSavedTheme) applyTheme(event.matches ? "dark" : "light");
});

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
