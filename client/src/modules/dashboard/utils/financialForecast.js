export function calculateFinancialForecast(records = [], now = new Date()) {
  const forecastMonth = getForecastMonth(now);
  const monthLabel = formatMonthLabel(forecastMonth.startDate);

  const filteredRecords = (records || []).filter((record) => isForecastEligibleRecord(record, forecastMonth));
  const expectedIncome = filteredRecords
    .filter((record) => record.type === "income")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);

  const expectedExpenses = filteredRecords
    .filter((record) => record.type === "expense")
    .reduce((sum, record) => sum + Number(record.amount || 0), 0);

  return {
    monthLabel,
    expectedIncome,
    expectedExpenses,
    balance: expectedIncome - expectedExpenses,
    hasForecastData: expectedIncome > 0 || expectedExpenses > 0,
  };
}

function getForecastMonth(now = new Date()) {
  const baseDate = new Date(now);
  const nextMonthIndex = baseDate.getMonth() + 1;
  const year = nextMonthIndex === 12 ? baseDate.getFullYear() + 1 : baseDate.getFullYear();
  const month = nextMonthIndex === 12 ? 0 : nextMonthIndex;

  return {
    year,
    month,
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month + 1, 0, 23, 59, 59, 999),
  };
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function isForecastEligibleRecord(record, forecastMonth) {
  if (!record || record.isDeleted) return false;

  const recordDate = parseDate(record.date || record.dueDate || record.due_date);
  if (!recordDate) return false;

  if (recordDate.getFullYear() !== forecastMonth.year || recordDate.getMonth() !== forecastMonth.month) {
    return false;
  }

  const status = `${record.status || ""}`.trim().toLowerCase();
  if (["completed", "paid", "cancelled", "canceled", "void", "deleted", "archived"].includes(status)) {
    return false;
  }

  const amount = Number(record.amount || 0);
  return Number.isFinite(amount) && amount > 0;
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
