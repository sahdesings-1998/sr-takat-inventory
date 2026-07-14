import Settings from "../models/Settings.js";

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

  // Find the document with the highest value for this field
  const lastDoc = await model.findOne({}, { [fieldName]: 1 })
    .sort({ [fieldName]: -1 })
    .lean();

  let nextNum = 1;

  if (lastDoc && lastDoc[fieldName]) {
    const val = lastDoc[fieldName];
    // Match the number at the end of the ID
    const match = val.match(/\d+$/);
    if (match) {
      nextNum = parseInt(match[0], 10) + 1;
    }
  }

  const paddedNum = String(nextNum).padStart(padding, "0");
  return `${prefix}-${paddedNum}`;
}

export default generateId;
