/**
 * One-off seed script: creates the three baseline roles if they don't
 * already exist. Run with: node scripts/seedRoles.js
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Role from "../models/Role.js";

const ROLES = [
  {
    name: "Admin",
    description: "Full system access",
    permissions: ["*"],
  },
  {
    name: "Manager",
    description: "Approvals, memo release, sales, reports",
    permissions: [
      "inventory.view",
      "inventory.create",
      "inventory.update",
      "inventory.delete",
      "costing.view",
      "costing.approve",
      "memo.view",
      "memo.release",
      "sales.view",
      "sales.create",
      "reports.view",
    ],
  },
  {
    name: "Workshop-Staff",
    description: "Day-to-day inventory and production entry",
    permissions: ["inventory.view", "inventory.create", "production.view", "production.update"],
  },
];

async function seed() {
  await connectDB();

  for (const role of ROLES) {
    const existing = await Role.findOne({ name: role.name });
    if (existing) {
      // eslint-disable-next-line no-console
      console.log(`Role "${role.name}" already exists — skipping`);
      continue;
    }
    await Role.create(role);
    // eslint-disable-next-line no-console
    console.log(`Created role "${role.name}"`);
  }

  await mongoose.disconnect();
  // eslint-disable-next-line no-console
  console.log("Done.");
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
