import IncomeManagement from "./pages/IncomeManagement.jsx";
import ExpenseManagement from "./pages/ExpenseManagement.jsx";

export const incomeExpenseRoutes = [
  {
    path: "/incomes",
    element: <IncomeManagement />,
  },
  {
    path: "/expenses",
    element: <ExpenseManagement />,
  },
];

export default incomeExpenseRoutes;
