import { Router } from 'express';
import { createAvailability } from './controllers/availability';
import {
  getCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerByIdWithOrderItems
} from './controllers/customers';
import { createOrder, deleteOrder } from './controllers/orders';
import { addProduct, getProducts } from './controllers/products';
import { getSuppliers } from './controllers/suppliers';
import welcome from './controllers/welcome';

const routes: Router = Router();

routes
  .get('/', welcome)
  .get('/products', getProducts)
  .post('/products', addProduct)
  .get('/suppliers', getSuppliers)
  .post('/availability', createAvailability)
  .get('/customers', getCustomers)
  .post('/customers', addCustomer)
  .get('/customers/:customerId', getCustomerById)
  .get('/customers/:customerId/orders', getCustomerByIdWithOrderItems)
  .put('/customers/:customerId', updateCustomer)
  .delete('/customers/:customerId', deleteCustomer)
  .post('/customers/:customerId/orders', createOrder)
  .delete('/orders/:orderId', deleteOrder);

export default routes;
