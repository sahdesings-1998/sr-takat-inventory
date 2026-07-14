import Expense from "../models/Expense.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllExpenses({ category, status, search, startDate, endDate } = {}) {
  const query = { isDeleted: false };

  if (category) query.category = category;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  if (search) {
    query.$or = [
      { description: { $regex: search, $options: "i" } },
      { reference: { $regex: search, $options: "i" } },
      { vendor: { $regex: search, $options: "i" } },
    ];
  }

  return Expense.find(query)
    .populate("createdBy", "firstName lastName email")
    .sort({ date: -1, createdAt: -1 });
}

async function getExpenseById(id) {
  const expense = await Expense.findById(id)
    .populate("createdBy", "firstName lastName email")
    .populate("deletedBy", "firstName lastName email");

  if (!expense) throw new ApiError(404, "Expense record not found");
  if (expense.isDeleted) throw new ApiError(404, "Expense record not found (deleted)");

  return expense;
}

async function createExpense(data, userId, ipAddress = "") {
  const expense = await Expense.create({
    ...data,
    createdBy: userId,
    date: data.date || new Date(),
  });

  await auditLogService.logAction({
    userId,
    entity: "Expense",
    entityId: expense._id,
    action: "create",
    newValue: expense.toObject(),
    ipAddress,
  });

  return getExpenseById(expense._id);
}

async function updateExpense(id, data, userId, ipAddress = "") {
  const expense = await getExpenseById(id);
  const oldVal = expense.toObject();

  Object.assign(expense, data);
  await expense.save();

  await auditLogService.logAction({
    userId,
    entity: "Expense",
    entityId: expense._id,
    action: "update",
    oldValue: oldVal,
    newValue: expense.toObject(),
    ipAddress,
  });

  return getExpenseById(expense._id);
}

async function deleteExpense(id, userId, ipAddress = "") {
  const expense = await getExpenseById(id);

  expense.isDeleted = true;
  expense.deletedAt = new Date();
  expense.deletedBy = userId;
  await expense.save();

  await auditLogService.logAction({
    userId,
    entity: "Expense",
    entityId: expense._id,
    action: "delete",
    oldValue: { isDeleted: false },
    newValue: { isDeleted: true, deletedAt: expense.deletedAt },
    ipAddress,
  });

  return { success: true, message: "Expense record deleted successfully" };
}

async function getExpenseStats(startDate, endDate) {
  const query = { isDeleted: false, status: "Completed" };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const stats = await Expense.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalExpense: { $sum: "$amount" },
        count: { $sum: 1 },
        byCategory: {
          $push: {
            category: "$category",
            amount: "$amount",
          },
        },
      },
    },
  ]);

  return stats[0] || { totalExpense: 0, count: 0, byCategory: [] };
}

export default {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats,
};
