import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";
import { uploadToCloudinary } from "../services/cloudinaryService.js";
import ApiError from "../utils/ApiError.js";

export const uploadFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  // Upload the file from memory buffer to Cloudinary
  const result = await uploadToCloudinary(req.file.buffer, "uploads");

  sendSuccess(res, {
    message: "File uploaded successfully",
    data: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });
});

export default {
  uploadFile,
};
