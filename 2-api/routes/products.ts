import express from "express";
import { getAllProducts, createProduct } from "../controllers/products";
const router = express.Router();

router.route("/").get(getAllProducts).post(createProduct);

export default router;
