import AuditLog from "../models/AuditLog.js";

/**
 * Creates a new audit log entry.
 *
 * @param {string} userId - The user ID performing the action
 * @param {string} entity - The collection or entity name (e.g. 'Gemstone', 'Memo', 'Sale', 'Product')
 * @param {string} entityId - The ID of the document being acted upon
 * @param {string} action - The action type ('create' | 'update' | 'delete')
 * @param {object} oldValue - The old state of the document (optional)
 * @param {object} newValue - The new state of the document (optional)
 * @param {string} ipAddress - The client IP address (optional)
 */
export async function logAction({
  userId,
  entity,
  entityId,
  action,
  oldValue = null,
  newValue = null,
  ipAddress = "",
}) {
  try {
    await AuditLog.create({
      userId,
      entity,
      entityId,
      action,
      oldValue,
      newValue,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write audit log:", err);
  }
}

export default { logAction };
