/* eslint-disable @typescript-eslint/naming-convention */
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { addAvailability } from '../../contexts/availability';
import { getProductById } from '../../contexts/products';
import { getSupplierById } from '../../contexts/suppliers';

export async function createAvailability(req: Request, res: Response) {
  const { supp_id, prod_id, price } = req.body;

  if (!supp_id || !prod_id || !price) {
    res.status(400).json({
      error: 'Missing required fields',
    });
    res.end();
  }

  const supplier = await getSupplierById(supp_id).then((result) => result.rows);
  const product = await getProductById(prod_id).then((result) => result.rows);

  if (!supplier || supplier.length === 0) {
    res.status(400).json({
      error: 'Supplier not found',
    });
    res.end();
  }

  if (!product || product.length === 0) {
    res.status(400).json({
      error: 'Product not found',
    });
    res.end();
  }

  if (Number.isNaN(Number(price)) || Number(price) < 0) {
    res.status(400).json({
      error: 'Invalid price',
    });
    res.end();
  }

  addAvailability(prod_id, supp_id, price)
    .then((result: QueryResult) => {
      if (result.rows) {
        res.status(200).send(...result.rows);
      }
    })
    .catch((e) => {
      res.status(500).json({
        error: e.message,
      });
    });
}
