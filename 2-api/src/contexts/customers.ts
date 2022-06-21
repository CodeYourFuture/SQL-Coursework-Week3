import { QueryResult } from 'pg';
import pool from '../db/pool';

export async function findCustomerById(
  id: string | number,
): Promise<QueryResult> {
  const query = 'SELECT * FROM customers WHERE id = $1';
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
