/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryResult } from 'pg';
import { id as ID } from '../types/id';
import objectToQuery from '../utils/objectToQuery';
import pool from '../db/pool';

export async function findCustomerById(id: ID): Promise<QueryResult> {
  const query = 'SELECT * FROM customers WHERE id = $1';
  return await pool.query(query, [id]);
}

export async function findCustomerByIdAndOrderItems(id: ID): Promise<QueryResult> {
  let query = 'SELECT orders.order_reference, orders.order_date, products.product_name, suppliers.supplier_name, order_items.quantity FROM customers ';
  query += ' INNER JOIN orders ON orders.customer_id = customers.id ';
  query += ' INNER JOIN order_items ON orders.id = order_items.order_id ';
  query += ' INNER JOIN products ON order_items.product_id = products.id ';
  query += ' INNER JOIN suppliers ON order_items.supplier_id = suppliers.id ';
  query += ' WHERE customers.id = $1';
  return await pool.query(query, [id]);
}

export async function createCustomer(
  name: string,
  address: string,
  city: string,
  country: string,
): Promise<QueryResult> {
  const query = 'INSERT INTO customers (name, address, city, country) VALUES ($1, $2, $3, $4) RETURNING *';
  return await pool.query(query, [name, address, city, country]);
}

export async function findAllCustomers(): Promise<QueryResult> {
  const query = 'SELECT * FROM customers';

  return await pool.query(query);
}

export async function findAndUpdateCustomer(
  customerId: ID,
  data: { [key: string]: any },
): Promise<QueryResult> {
  const setQuery = objectToQuery(data);
  const query = `UPDATE customers SET ${setQuery} WHERE id = $1 RETURNING *`;

  return await pool.query(query, [customerId]);
}

export async function findAndDeleteCustomer(customerId: ID): Promise<QueryResult> {
  const query = 'DELETE FROM customers WHERE id = $1';

  return await pool.query(query, [customerId]);
}
