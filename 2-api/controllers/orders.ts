import express, { Express, Request, Response } from "express";
import { client } from "../server";
export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const deleteSql = `DELETE FROM orders WHERE id=$1 RETURNING *`;
    const result = await client.query(deleteSql, [req.params.orderId]);
    return res.status(200).json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    return res.status(400).json({ error: err.message });
  }
};
