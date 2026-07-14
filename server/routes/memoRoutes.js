import { Router } from "express";
import * as memoController from "../controllers/memoController.js";
import auth from "../middleware/auth.js";
import { requirePermission } from "../middleware/permissions.js";

const router = Router();

router.use(auth);

router.get("/", requirePermission("memo.view"), memoController.getMemos);
router.get("/:id", requirePermission("memo.view"), memoController.getMemo);
router.post("/", requirePermission("memo.release"), memoController.createMemo);
router.patch(
  "/:id/items/:itemId/return",
  requirePermission("memo.release"),
  memoController.returnMemoItem
);
router.patch(
  "/:id/items/:itemId/sale",
  requirePermission("memo.release"),
  memoController.convertMemoToSale
);
router.patch(
  "/:id/extend",
  requirePermission("memo.release"),
  memoController.extendMemo
);

export default router;
