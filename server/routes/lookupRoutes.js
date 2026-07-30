import { Router } from "express";
import * as lookupController from "../controllers/lookupController.js";
import auth from "../middleware/auth.js";

const router = Router();

router.use(auth);

router.get("/", lookupController.getLookups);
router.post("/", lookupController.createLookup);
router.put("/:id", lookupController.updateLookup);
router.delete("/:id", lookupController.deleteLookup);

export default router;
