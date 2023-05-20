import express from "express";
import { getAllSuppliers } from "../controllers/suppliers";

const router = express.Router();
router.route("/").get(getAllSuppliers);

export default router;
