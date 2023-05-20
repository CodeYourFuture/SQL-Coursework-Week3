import { queryAndRespond } from "../utils/functions";
import express, { Express, Request, Response } from "express";

export const getAllProducts = (req: Request, res: Response) => {
  const sql = `SELECT CAST(row_number() over () AS INTEGER) as id,p.product_name,pa.unit_price,s.supplier_name from products p JOIN product_availability pa ON p.id = pa.prod_id JOIN suppliers s ON pa.supp_id = s.id ${
    req.query.name ? `WHERE p.product_name ILIKE '%${req.query.name}%'` : ""
  }`;
  queryAndRespond(res, sql);
};

export const createProduct = (req: Request, res: Response) => {
  const { product_name } = req.body;
  if (!product_name) {
    return res.status(400).json({ error: `Product name is required` });
  }
  const sql = `INSERT INTO products (product_name) VALUES ($1) RETURNING *`;
  queryAndRespond(res, sql, [product_name]);
};
