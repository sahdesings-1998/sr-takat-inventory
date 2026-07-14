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

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  addComponent,
  deleteComponent,
};
