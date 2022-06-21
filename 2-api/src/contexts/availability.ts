import { QueryResult } from 'pg';
import pool from '../db/pool';
import { id } from '../types/id';

export async function addAvailability(
  prod_id: id,
  supp_id: id,
  unit_price: number,
): Promise<QueryResult> {
  const query = 'INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3) RETURNING *';
  return await pool.query(query, [prod_id, supp_id, unit_price]);
}
