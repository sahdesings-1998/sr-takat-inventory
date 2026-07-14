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

  // If a file is uploaded, upload to Cloudinary. Otherwise fall back to fileUrl string.
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.buffer, "certificates");
    certData.fileUrl = uploadResult.secure_url;
    certData.publicId = uploadResult.public_id;
  } else if (!certData.fileUrl) {
    throw new ApiError(400, "Certificate file or file URL is required");
  }

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

export default {
  getCertificates,
  getCertificate,
  createCertificate,
  deleteCertificate,
};
