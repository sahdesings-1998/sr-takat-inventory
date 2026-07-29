import productService from "../services/productService.js";
import catchAsync from "../utils/catchAsync.js";
import sendSuccess from "../utils/apiResponse.js";

export const getProducts = catchAsync(async (req, res) => {
  const products = await productService.getAllProducts(req.query);
  sendSuccess(res, { message: "Products retrieved successfully", data: products });
});

export const getProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await productService.getProductById(id);
  sendSuccess(res, { message: "Product retrieved successfully", data: result });
});

export const createProduct = catchAsync(async (req, res) => {
  const product = await productService.createProduct(req.body, req.user._id, req.ip);
  sendSuccess(res, { statusCode: 201, message: "Product created successfully", data: product });
});

export const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const product = await productService.updateProduct(id, req.body, req.user._id, req.ip);
  sendSuccess(res, { message: "Product updated successfully", data: product });
});

export const deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  await productService.softDeleteProduct(id, req.user._id, req.ip);
  sendSuccess(res, { message: "Product deleted successfully" });
});

export const addComponent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const component = await productService.addProductComponent(id, req.body, req.user._id);
  sendSuccess(res, { statusCode: 201, message: "Component added successfully", data: component });
});

export const deleteComponent = catchAsync(async (req, res) => {
  const { id, componentId } = req.params;
  await productService.deleteProductComponent(id, componentId, req.user._id);
  sendSuccess(res, { message: "Component removed successfully" });
});

export const scanProduct = catchAsync(async (req, res) => {
  const codeParam = req.params.code || req.query.code || req.params[0];
  console.log(`[ProductController] scanProduct HIT: method=${req.method}, originalUrl=${req.originalUrl}, codeParam="${codeParam}"`);

  if (codeParam === undefined || codeParam === null || String(codeParam).trim() === "") {
    throw new ApiError(400, "Scanned code parameter or query is required");
  }

  const result = await productService.lookupProductByCode(codeParam);
  sendSuccess(res, { message: "Product details retrieved by scanned code", data: result });
});

export default {
  getProducts,
  getProduct,
  scanProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addComponent,
  deleteComponent,
};
