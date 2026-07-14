import Income from "../models/Income.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllIncomes({ category, status, search, startDate, endDate } = {}) {
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
    ];
  }

  return Income.find(query)
    .populate("createdBy", "firstName lastName email")
    .sort({ date: -1, createdAt: -1 });
}

async function getIncomeById(id) {
  const income = await Income.findById(id)
    .populate("createdBy", "firstName lastName email")
    .populate("deletedBy", "firstName lastName email");

  if (!income) throw new ApiError(404, "Income record not found");
  if (income.isDeleted) throw new ApiError(404, "Income record not found (deleted)");

  return income;
}

async function createIncome(data, userId, ipAddress = "") {
  const income = await Income.create({
    ...data,
    createdBy: userId,
    date: data.date || new Date(),
  });

  await auditLogService.logAction({
    userId,
    entity: "Income",
    entityId: income._id,
    action: "create",
    newValue: income.toObject(),
    ipAddress,
  });

  return getIncomeById(income._id);
}

async function updateIncome(id, data, userId, ipAddress = "") {
  const income = await getIncomeById(id);
  const oldVal = income.toObject();

  Object.assign(income, data);
  await income.save();

  await auditLogService.logAction({
    userId,
    entity: "Income",
    entityId: income._id,
    action: "update",
    oldValue: oldVal,
    newValue: income.toObject(),
    ipAddress,
  });

  return getIncomeById(income._id);
}

async function deleteIncome(id, userId, ipAddress = "") {
  const income = await getIncomeById(id);

  income.isDeleted = true;
  income.deletedAt = new Date();
  income.deletedBy = userId;
  await income.save();

  await auditLogService.logAction({
    userId,
    entity: "Income",
    entityId: income._id,
    action: "delete",
    oldValue: { isDeleted: false },
    newValue: { isDeleted: true, deletedAt: income.deletedAt },
    ipAddress,
  });

  return { success: true, message: "Income record deleted successfully" };
}

async function getIncomeStats(startDate, endDate) {
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

  const stats = await Income.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: "$amount" },
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

  return stats[0] || { totalIncome: 0, count: 0, byCategory: [] };
}

export default {
  getAllIncomes,
  getIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
  getIncomeStats,
};
