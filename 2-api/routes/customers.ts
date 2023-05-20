import express from "express";
import {
  getAllCustomers,
  createCustomer,
  getCustomer,
  createOrder,
  updateCustomer,
  deleteCustomer,
  getOrders,
} from "../controllers/customers";
const router = express.Router();
router.route("/").get(getAllCustomers).post(createCustomer);
router
  .route("/:customerId")
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);
router.route("/:customerId/orders").get(getOrders).post(createOrder);

export default router;
