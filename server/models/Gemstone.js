import mongoose from "mongoose";
import Product from "./Product.js";

// Alias "Gemstone" model to "Product" schema and "products" collection
// so any populate() calls referencing "Gemstone" via refPath query the products collection.
const Gemstone =
  mongoose.models.Gemstone ||
  mongoose.model("Gemstone", Product.schema, "products");

export default Gemstone;
