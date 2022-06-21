import pool from '../db/pool';

export async function getSupplierById(id: string | number) {
  const query = 'SELECT * FROM suppliers WHERE id = $1';
  return await pool.query(query, [id]);
}

export async function findAllSuppliers() {
  const query = 'SELECT * FROM suppliers';
  return await pool.query(query);
}
