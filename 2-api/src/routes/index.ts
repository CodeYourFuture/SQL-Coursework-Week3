import { Router } from 'express';
import { createAvailability } from './controllers/availability';
import {
  getCustomers,
  getCustomerById,
  addCustomer,
} from './controllers/customers';
import { createOrder } from './controllers/orders';
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
  .get('/customers/:customerId', getCustomerById)
  .post('/customers', addCustomer)
  .post('/customers/:customerId/orders', createOrder);

export default routes;
