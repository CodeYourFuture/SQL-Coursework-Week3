import { client } from "../server";
import express, { Express, Request, Response } from "express";
export const queryAndRespond = async <T>(
  res: Response,
  sql: string,
  arr: T[] = []
) => {
  try {
    const result = await client.query(sql, arr);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
};
export const checkExistById = async (
  tableName: string,
  columnIdName: string
) => {
  const checkSql = `SELECT id FROM ${tableName} WHERE id = $1`;
  const checkExist = await client.query(checkSql, [columnIdName]);
  if (checkExist.rowCount === 0) {
    throw new Error(`${tableName} Id does not exist.`);
  }
  return checkExist.rows[0].id;
};
