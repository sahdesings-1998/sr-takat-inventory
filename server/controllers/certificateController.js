import certificateService from "../services/certificateService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../services/cloudinaryService.js";
import ApiError from "../utils/ApiError.js";

export const getCertificates = catchAsync(async (req, res) => {
  const certs = await certificateService.getAllCertificates(req.query);
  sendSuccess(res, { message: "Certificates retrieved successfully", data: certs });
});

export const getCertificate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cert = await certificateService.getCertificateById(id);
  sendSuccess(res, { message: "Certificate retrieved successfully", data: cert });
});

export const createCertificate = catchAsync(async (req, res) => {
  const certData = { ...req.body };

  if (req.file) {
    const isPdf = req.file.mimetype === "application/pdf" || req.file.originalname.toLowerCase().endsWith(".pdf");
    const resourceType = isPdf ? "raw" : "image";
    
    console.log(`[upload] Starting certificate upload. Filename: "${req.file.originalname}", MIME: "${req.file.mimetype}", Size: ${req.file.size} bytes. Cloudinary type: "${resourceType}"`);
    
    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "certificates", resourceType);
      
      console.log(`[upload] Cloudinary upload successful. Url: "${uploadResult.secure_url}", PublicID: "${uploadResult.public_id}", Bytes: ${uploadResult.bytes}`);
      
      certData.fileUrl = uploadResult.secure_url;
      certData.publicId = uploadResult.public_id;
      certData.resourceType = uploadResult.resource_type || resourceType;
      certData.format = isPdf ? "pdf" : (uploadResult.format || req.file.mimetype.split("/")[1]);
      certData.originalFilename = uploadResult.original_filename || req.file.originalname;
      certData.bytes = uploadResult.bytes || req.file.size;
      certData.uploadTimestamp = uploadResult.created_at ? new Date(uploadResult.created_at) : new Date();
    } catch (err) {
      console.error("[upload] Cloudinary upload failed:", err);
      throw new ApiError(500, `Cloudinary upload failed: ${err.message}`);
    }
  } else {
    console.warn("[upload] Attempted to create certificate without file payload.");
    throw new ApiError(400, "Certificate file is required");
  }

  console.log(`[upload] Saving certificate to database: CertNo: "${certData.certificateNo}", Entity: "${certData.entityType}" (${certData.entityId})`);
  const cert = await certificateService.createCertificate(certData);
  sendSuccess(res, { statusCode: 201, message: "Certificate created successfully", data: cert });
});

export const deleteCertificate = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Call the service to soft-delete from DB and unlink from gemstone/product
  const deletedCert = await certificateService.deleteCertificate(id, req.user._id);
  
  // Clean up the Cloudinary resource if a publicId was stored
  if (deletedCert && deletedCert.publicId) {
    try {
      await deleteFromCloudinary(deletedCert.publicId);
    } catch (err) {
      console.error(`Failed to clean up Cloudinary resource on certificate deletion: ${err.message}`);
    }
  }

  sendSuccess(res, { message: "Certificate deleted successfully" });
});

export const getCertificateFile = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cert = await certificateService.getCertificateById(id);

  if (!cert || !cert.fileUrl) {
    throw new ApiError(404, "Certificate file not found");
  }

  try {
    const response = await fetch(cert.fileUrl);
    if (!response.ok) {
      throw new ApiError(500, `Failed to retrieve certificate from storage: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "application/pdf";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="certificate_${cert.certificateNo}"`);
    return res.send(buffer);
  } catch (err) {
    console.error("Error retrieving certificate file proxy:", err);
    throw new ApiError(500, `Error fetching certificate file: ${err.message}`);
  }
});

export default {
  getCertificates,
  getCertificate,
  createCertificate,
  deleteCertificate,
  getCertificateFile,
};
