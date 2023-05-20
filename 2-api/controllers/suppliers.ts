import { queryAndRespond } from "../utils/functions";
import express, { Express, Request, Response } from "express";

export const getAllSuppliers = (req: Request, res: Response) =>
  queryAndRespond(res, "SELECT * from suppliers");
