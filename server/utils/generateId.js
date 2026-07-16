import Settings from "../models/Settings.js";

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generates a unique sequential identifier for a given model and field.
 * Example format: GEM-00001, JOB-00104, etc.
 *
 * @param {mongoose.Model} model - The Mongoose model to query
 * @param {string} fieldName - The field containing the ID (e.g. 'stoneId')
 * @param {string} prefixType - The settings prefix key (e.g. 'gemstone', 'product', 'invoice')
 * @param {number} padding - Number of digits to pad (default 5)
 */
export async function generateId(model, fieldName, prefixType, padding = 5) {
  const settings = await Settings.getSettings();
  const prefix = settings.prefixes[prefixType] || "SYS";
  const prefixPattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)$`);

  const docs = await model.find(
    { [fieldName]: { $regex: prefixPattern } },
    { [fieldName]: 1 }
  ).lean();

  let nextNum = 1;
  for (const doc of docs) {
    const value = doc[fieldName];
    const match = value.match(prefixPattern);
    if (match) {
      nextNum = Math.max(nextNum, parseInt(match[1], 10) + 1);
    }
  }

  const paddedNum = String(nextNum).padStart(padding, "0");
  return `${prefix}-${paddedNum}`;
}

export default generateId;
