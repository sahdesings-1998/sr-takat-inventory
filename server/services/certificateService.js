import Certificate from "../models/Certificate.js";
import Gemstone from "../models/Gemstone.js";
import Product from "../models/Product.js";
import ApiError from "../utils/ApiError.js";

async function getAllCertificates({ entityType, entityId } = {}) {
  const query = { isDeleted: false };
  if (entityType) query.entityType = entityType;
  if (entityId) query.entityId = entityId;
  return Certificate.find(query).sort({ createdAt: -1 }).populate("entityId");
}

async function getCertificateById(id) {
  const cert = await Certificate.findOne({ _id: id, isDeleted: false }).populate("entityId");
  if (!cert) throw new ApiError(404, "Certificate not found");
  return cert;
}

async function createCertificate(data) {
  const existing = await Certificate.findOne({ certificateNo: data.certificateNo, isDeleted: false });
  if (existing) throw new ApiError(409, "A certificate with this number already exists");

  const cert = await Certificate.create(data);

  if (data.entityType === "Gemstone") {
    await Gemstone.findByIdAndUpdate(data.entityId, { certificateId: cert._id });
  } else if (data.entityType === "Product") {
    await Product.findByIdAndUpdate(data.entityId, { $push: { certificateIds: cert._id } });
  }

  return cert;
}

async function deleteCertificate(id, userId) {
  const cert = await getCertificateById(id);

  // Unlink from parent entity
  if (cert.entityType === "Gemstone") {
    await Gemstone.findByIdAndUpdate(cert.entityId, { certificateId: null });
  } else if (cert.entityType === "Product") {
    await Product.findByIdAndUpdate(cert.entityId, { $pull: { certificateIds: cert._id } });
  }

  // Soft delete — mark as deleted, do not remove from DB
  await Certificate.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: userId || null,
  });

  return cert;
}

export default {
  getAllCertificates,
  getCertificateById,
  createCertificate,
  deleteCertificate,
};
