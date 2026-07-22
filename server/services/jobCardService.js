import JobCard from "../models/JobCard.js";
import Material from "../models/Material.js";
import generateId from "../utils/generateId.js";
import movementService from "./movementService.js";
import auditLogService from "./auditLogService.js";
import ApiError from "../utils/ApiError.js";

async function getAllJobCards({ status, assignedTo } = {}) {
  const query = {};
  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;
  return JobCard.find(query).sort({ createdAt: -1 }).populate("productId").populate("assignedTo");
}

async function getJobCardById(id) {
  const job = await JobCard.findById(id)
    .populate("productId")
    .populate("assignedTo")
    .populate("materialsIssued.materialId")
    .populate("materialsUsed.materialId")
    .populate("materialsReturned.materialId");
  if (!job) throw new ApiError(404, "Job Card not found");
  return job;
}

const WORKFLOW_STAGES = [
  "Design",
  "Materials Issued",
  "Manufacturing",
  "Stone Setting",
  "Polishing",
  "QC",
  "Completed",
];

async function createJobCard(data, userId, ipAddress = "") {
  const jobNo = await generateId(JobCard, "jobNo", "jobCard", 5);

  const initialStages = WORKFLOW_STAGES.map((stageName, idx) => ({
    stageName,
    status: idx === 0 ? "In Progress" : "Pending",
    notes: idx === 0 ? "Initial production job design phase" : "",
  }));

  const job = await JobCard.create({
    ...data,
    jobNo,
    status: "Assigned",
    productionStages: initialStages,
  });

  await auditLogService.logAction({
    userId,
    entity: "JobCard",
    entityId: job._id,
    action: "create",
    newValue: job.toObject(),
    ipAddress,
  });

  return getJobCardById(job._id);
}

async function updateJobCard(id, data, userId, ipAddress = "") {
  const job = await JobCard.findById(id);
  if (!job) throw new ApiError(404, "Job Card not found");
  const oldVal = job.toObject();

  Object.assign(job, data);
  await job.save();

  await auditLogService.logAction({
    userId,
    entity: "JobCard",
    entityId: job._id,
    action: "update",
    oldValue: oldVal,
    newValue: job.toObject(),
    ipAddress,
  });

  return getJobCardById(id);
}

async function updateStage(id, stageData, userId) {
  const job = await JobCard.findById(id);
  if (!job) throw new ApiError(404, "Job Card not found");

  const existingIndex = job.productionStages.findIndex((s) => s.stageName === stageData.stageName);
  if (existingIndex > -1) {
    job.productionStages[existingIndex].status = stageData.status;
    job.productionStages[existingIndex].notes = stageData.notes || "";
    job.productionStages[existingIndex].updatedBy = userId;
    job.productionStages[existingIndex].updatedAt = new Date();
  } else {
    job.productionStages.push({
      stageName: stageData.stageName,
      status: stageData.status,
      notes: stageData.notes || "",
      updatedBy: userId,
      updatedAt: new Date(),
    });
  }

  if (stageData.status === "In Progress") {
    job.status = "In Progress";
  } else if (stageData.stageName === "Completed" && stageData.status === "Completed") {
    job.status = "Completed";
    job.completedDate = new Date();
  }

  await job.save();
  return getJobCardById(id);
}

async function issueMaterials(id, { materialId, quantity }, userId) {
  const job = await JobCard.findById(id);
  if (!job) throw new ApiError(404, "Job Card not found");

  const material = await Material.findById(materialId);
  if (!material || material.quantity < quantity) {
    throw new ApiError(400, "Insufficient material quantity in inventory");
  }

  material.quantity -= quantity;
  await material.save();

  job.materialsIssued.push({
    materialId,
    quantity,
    issuedBy: userId,
    issuedAt: new Date(),
  });

  // Automatically mark Materials Issued stage as In Progress or Completed
  const stageIdx = job.productionStages.findIndex((s) => s.stageName === "Materials Issued");
  if (stageIdx > -1) {
    job.productionStages[stageIdx].status = "Completed";
    job.productionStages[stageIdx].notes = `Issued ${quantity} ${material.unit || "units"} of ${material.materialName}`;
  }

  await job.save();

  await movementService.logMovement({
    inventoryType: "Material",
    inventoryId: materialId,
    action: "Issue to Production",
    quantity: quantity,
    referenceType: "JobCard",
    referenceId: id,
    userId,
    remarks: `Material issued to job card: ${job.jobNo}`,
  });

  return getJobCardById(id);
}

async function recordMaterialUsage(id, { materialId, quantity }, userId) {
  const job = await JobCard.findById(id);
  if (!job) throw new ApiError(404, "Job Card not found");

  const material = await Material.findById(materialId);
  if (!material) throw new ApiError(404, "Material not found");

  job.materialsUsed.push({
    materialId,
    quantity,
    usedBy: userId,
    usedAt: new Date(),
  });

  await job.save();
  return getJobCardById(id);
}

async function returnMaterials(id, { materialId, quantity, wastageType, returnedToStockQuantity, wastageQuantity }, userId) {
  const job = await JobCard.findById(id);
  if (!job) throw new ApiError(404, "Job Card not found");

  const material = await Material.findById(materialId);
  if (!material) throw new ApiError(404, "Material not found");

  const returnQty = returnedToStockQuantity ?? (wastageType === "returnedToStock" ? quantity : 0);
  const wasteQty = wastageQuantity ?? (wastageType !== "returnedToStock" ? quantity : 0);

  if (returnQty > 0) {
    material.quantity += returnQty;
    await material.save();
  }

  if (wastageType === "scrapRecovery" && wasteQty > 0) {
    let scrapMaterial = await Material.findOne({ materialCode: "MET-AU-SCRAP" });
    if (!scrapMaterial) {
      scrapMaterial = await Material.create({
        materialCode: "MET-AU-SCRAP",
        materialName: "Scrap Gold Stock",
        category: "Gold",
        unit: material.unit || "g",
        quantity: 0,
        cost: 0,
        location: "Scrap Vault",
        status: "active",
      });
    }
    scrapMaterial.quantity += wasteQty;
    await scrapMaterial.save();
  }

  job.materialsReturned.push({
    materialId,
    quantity,
    returnedToStockQuantity: returnQty,
    wastageQuantity: wasteQty,
    wastageType,
    returnedBy: userId,
    returnedAt: new Date(),
  });

  await job.save();

  await movementService.logMovement({
    inventoryType: "Material",
    inventoryId: materialId,
    action: "Return from Production",
    quantity: quantity,
    referenceType: "JobCard",
    referenceId: id,
    userId,
    remarks: `Material returned/reconciled from job card: ${job.jobNo} (Returned: ${returnQty}, Wastage: ${wasteQty})`,
  });

  return getJobCardById(id);
}

export default {
  getAllJobCards,
  getJobCardById,
  createJobCard,
  updateJobCard,
  updateStage,
  issueMaterials,
  recordMaterialUsage,
  returnMaterials,
};
