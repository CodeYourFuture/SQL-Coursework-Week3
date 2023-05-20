import { queryAndRespond, checkExistById } from "../utils/functions";
import express, { Express, Request, Response } from "express";
import { client } from "../server";

export const getAllCustomers = (req: Request, res: Response) =>
  queryAndRespond(res, "SELECT * from customers");

export const getCustomer = (req: Request, res: Response) => {
  const sql = `SELECT * from customers ${
    req.params.customerId ? `WHERE id = ${req.params.customerId}` : ""
  }`;
  queryAndRespond(res, sql);
};
export const createCustomer = (req: Request, res: Response) => {
  const { name, address, city, country } = req.body;
  if (!name || !address || !city || !country) {
    res.status(400).json({ error: `Name,Address,City,Country are required` });
  }
  const sql = `INSERT INTO customers (name,address,city,country) VALUES ($1,$2,$3,$4) RETURNING *`;
  queryAndRespond(res, sql, [name, address, city, country]);
};
export const getOrders = (req: Request, res: Response) => {
  const sql = `select o.order_reference, o.order_date, p.product_name, pa.unit_price, s.supplier_name , i.quantity from customers c JOIN orders o ON c.id=o.customer_id JOIN order_items i ON i.order_id=o.id JOIN product_availability pa ON pa.prod_id = i.product_id JOIN suppliers s ON s.id=pa.supp_id JOIN products p ON p.id=pa.prod_id WHERE c.id=$1;`;
  queryAndRespond(res, sql, [req.params.customerId]);
};

export const createOrder = async (req: Request, res: Response) => {
  const { order_date, order_reference } = req.body;
  try {
    const customerId = await checkExistById("customers", req.params.customerId);
    const insertSql = `INSERT INTO orders (order_date, order_reference, customer_id) VALUES ($1,$2,$3) RETURNING *`;
    const insert = await client.query(insertSql, [
      order_date,
      order_reference,
      customerId,
    ]);
    return res.status(200).json(insert.rows[0]);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const customerId = await checkExistById("customers", req.params.customerId);
    const updateSql = `UPDATE customers SET name=$1, address=$2, city=$3 , country=$4 WHERE id = $5 RETURNING *`;
    const update = await client.query(updateSql, [
      req.body.name,
      req.body.address,
      req.body.city,
      req.body.country,
      customerId,
    ]);
    return res.status(200).json(update.rows[0]);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};

export const deleteCustomer = async (req: Request, res: Response) => {
  try {
    const checkIfExist = await client.query(
      `select * from orders where customer_id=$1`,
      [req.params.customerId]
    );

    if (checkIfExist.rows[0].length > 0) {
      return res
        .status(400)
        .json({ error: "Can't delete customer with existing orders" });
    } else {
      const deleteSql = `DELETE FROM orders WHERE id=$1 RETURNING *`;
      const result = await client.query(deleteSql, [req.params.customerId]);
      return res.status(200).json(result.rows[0]);
    }
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};
