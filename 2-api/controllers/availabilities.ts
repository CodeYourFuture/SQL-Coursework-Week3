import { checkExistById } from "../utils/functions";
import { client } from "../server";
import express, { Express, Request, Response } from "express";

export const getAllAvailabilities = async (req: Request, res: Response) => {
  const { prod_id, supp_id, unit_price } = req.body;
  try {
    if (!Number.isInteger(Number(unit_price)) || Number(unit_price) <= 0) {
      throw new Error(`Price must be a positive integer.`);
    }
    const prodId = await checkExistById("products", prod_id);
    const suppId = await checkExistById("suppliers", supp_id);
    const insertSql = `INSERT INTO product_availability (prod_id,supp_id,unit_price) VALUES ($1,$2,$3) RETURNING *`;
    const insert = await client.query(insertSql, [prodId, suppId, unit_price]);
    res.status(200).json(insert.rows[0]);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};
