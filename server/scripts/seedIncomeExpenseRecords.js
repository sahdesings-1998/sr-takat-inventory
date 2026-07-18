import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';

async function main() {
  await connectDB();

  let user = await User.findOne({}).lean();
  if (!user) {
    const Role = (await import('../models/Role.js')).default;
    const role = await Role.findOne({ name: 'Admin' });
    user = await User.create({
      fullName: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      roleId: role?._id,
    });
  }

  const createdBy = user._id;

  const incomeRecords = [
    {
      date: new Date('2026-06-15T09:00:00.000Z'),
      category: 'Sales',
      description: 'Customer payment - Sapphire ring',
      amount: 18500,
      paymentMethod: 'Bank Transfer',
      status: 'Completed',
      reference: 'INV-0601',
      notes: 'Previous month customer payment',
      createdBy,
    },
    {
      date: new Date('2026-07-05T09:00:00.000Z'),
      category: 'Services',
      description: 'Salary deposit - July consultancy',
      amount: 120000,
      paymentMethod: 'Bank Transfer',
      status: 'Completed',
      reference: 'SAL-0701',
      notes: 'Current month income',
      createdBy,
    },
    {
      date: new Date('2026-07-20T09:00:00.000Z'),
      category: 'Sales',
      description: 'Customer payment - Ruby pendant',
      amount: 9500,
      paymentMethod: 'Cash',
      status: 'Pending',
      reference: 'INV-0720',
      notes: 'Upcoming current month payment',
      createdBy,
    },
    {
      date: new Date('2026-08-10T09:00:00.000Z'),
      category: 'Sales',
      description: 'Customer payment - Wedding set',
      amount: 18000,
      paymentMethod: 'Digital Payment',
      status: 'Pending',
      reference: 'INV-0810',
      notes: 'Next month forecast income',
      createdBy,
    },
    {
      date: new Date('2026-08-18T09:00:00.000Z'),
      category: 'Other',
      description: 'Miscellaneous income - referral commission',
      amount: 3200,
      paymentMethod: 'Bank Transfer',
      status: 'Pending',
      reference: 'MISC-0818',
      notes: 'Next month upcoming income',
      createdBy,
    },
  ];

  const expenseRecords = [
    {
      date: new Date('2026-06-12T09:00:00.000Z'),
      category: 'Rent',
      description: 'Office rent - June',
      amount: 25000,
      paymentMethod: 'Bank Transfer',
      status: 'Completed',
      reference: 'EXP-0612',
      vendor: 'BlueStone Plaza',
      notes: 'Previous month expense',
      createdBy,
    },
    {
      date: new Date('2026-06-18T09:00:00.000Z'),
      category: 'Utilities',
      description: 'Utilities payment - electricity and internet',
      amount: 6450,
      paymentMethod: 'Bank Transfer',
      status: 'Pending',
      reference: 'EXP-0618',
      vendor: 'City Utilities',
      notes: 'Overdue pending expense',
      createdBy,
    },
    {
      date: new Date('2026-07-03T09:00:00.000Z'),
      category: 'Materials',
      description: 'Supplier payment - gold supply',
      amount: 86000,
      paymentMethod: 'Bank Transfer',
      status: 'Completed',
      reference: 'EXP-0703',
      vendor: 'Chennai Gold Refinery',
      notes: 'Current month supplier settlement',
      createdBy,
    },
    {
      date: new Date('2026-07-15T09:00:00.000Z'),
      category: 'Office Supplies',
      description: 'Miscellaneous office supplies',
      amount: 4380,
      paymentMethod: 'Cash',
      status: 'Pending',
      reference: 'EXP-0715',
      vendor: 'Office Hub',
      notes: 'Current month pending expense',
      createdBy,
    },
    {
      date: new Date('2026-08-02T09:00:00.000Z'),
      category: 'Rent',
      description: 'Office rent - August',
      amount: 25000,
      paymentMethod: 'Bank Transfer',
      status: 'Pending',
      reference: 'EXP-0802',
      vendor: 'BlueStone Plaza',
      notes: 'Next month forecast expense',
      createdBy,
    },
    {
      date: new Date('2026-08-14T09:00:00.000Z'),
      category: 'Utilities',
      description: 'Utilities payment - water and electricity',
      amount: 5850,
      paymentMethod: 'Digital Payment',
      status: 'Pending',
      reference: 'EXP-0814',
      vendor: 'City Utilities',
      notes: 'Next month upcoming expense',
      createdBy,
    },
  ];

  await Income.insertMany(incomeRecords);
  await Expense.insertMany(expenseRecords);

  console.log(`Inserted ${incomeRecords.length} income records and ${expenseRecords.length} expense records.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
