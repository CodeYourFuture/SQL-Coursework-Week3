import dayjs from 'dayjs';
import { QueryResult } from 'pg';
import pool from '../db/pool';

export async function getMaxOrderRef():Promise<number> {
  const query = 'SELECT order_reference FROM orders ORDER BY order_reference DESC LIMIT 1';
  return await pool.query(query).then((result) => {
    if (!result.rows || result.rows.length === 0) {
      return 0;
    }
    return Number(result.rows[0].order_reference.replace('ORD', ''));
  });
}

export async function addOrder(
  customer_id: string | number,
): Promise<QueryResult> {
  const currentDate = dayjs().format('YYYY-MM-DD');
  const maxOrderRef = await getMaxOrderRef();
  const orderRef = `ORD${(maxOrderRef + 1).toString().padStart(3, '0')}`;
  const query = 'INSERT INTO orders(order_date, customer_id, order_reference) VALUES ($1, $2, $3) RETURNING *';
  return await pool.query(query, [currentDate, customer_id, orderRef]);
}
