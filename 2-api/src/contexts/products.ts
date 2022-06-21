import { QueryResult } from 'pg';
import pool from '../db/pool';

export async function getProductById(id: string): Promise<QueryResult> {
  const query = 'SELECT * FROM products WHERE id = $1';
  return await pool.query(query, [id]);
}

export async function createProduct(name: string): Promise<QueryResult> {
  const query = 'INSERT INTO products (product_name) VALUES ($1) RETURNING *';
  return await pool.query(query, [name]);
}

export async function findProducts(searchQuery?: string): Promise<QueryResult> {
  let query = 'SELECT products.product_name, product_availability.unit_price, suppliers.supplier_name FROM products ';
  query
    += 'INNER JOIN product_availability ON products.id = product_availability.prod_id ';
  query
    += 'INNER JOIN suppliers ON product_availability.supp_id = suppliers.id';
  if (searchQuery) {
    query += ' WHERE LOWER(products.product_name) LIKE $1';
    return await pool.query(query, [`%${searchQuery}%`]);
  }
  return await pool.query(query);
}
