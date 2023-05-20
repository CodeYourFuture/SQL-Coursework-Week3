import express from "express";
const router = express.Router();
import { getAllAvailabilities } from "../controllers/availabilities";

router.route("/").get(getAllAvailabilities);

export default router;
