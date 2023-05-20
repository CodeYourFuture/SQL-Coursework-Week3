import express from "express";
const router = express.Router();
import { deleteOrder } from "../controllers/orders";

router.route("/:orderId").delete(deleteOrder);

export default router;
