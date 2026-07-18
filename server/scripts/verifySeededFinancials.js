import { calculateFinancialForecast } from '../../client/src/modules/dashboard/utils/financialForecast.js';

const loginResponse = await fetch('http://localhost:5000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
});

const loginData = await loginResponse.json();
const cookie = loginResponse.headers.get('set-cookie') || '';
const headers = { cookie };

const incomesResponse = await fetch('http://localhost:5000/api/v1/incomes', { headers });
const incomesData = await incomesResponse.json();
const expensesResponse = await fetch('http://localhost:5000/api/v1/expenses', { headers });
const expensesData = await expensesResponse.json();

const incomes = Array.isArray(incomesData?.data) ? incomesData.data : [];
const expenses = Array.isArray(expensesData?.data) ? expensesData.data : [];
const records = [
  ...incomes.map((record) => ({ ...record, type: 'income' })),
  ...expenses.map((record) => ({ ...record, type: 'expense' })),
];
const forecast = calculateFinancialForecast(records, new Date('2026-07-18T00:00:00.000Z'));

console.log(JSON.stringify({
  success: true,
  incomeCount: incomes.length,
  expenseCount: expenses.length,
  sampleIncome: incomes.slice(0, 2).map((item) => ({ description: item.description, amount: item.amount, status: item.status, date: item.date })),
  sampleExpense: expenses.slice(0, 2).map((item) => ({ description: item.description, amount: item.amount, status: item.status, date: item.date })),
  forecast,
}, null, 2));
