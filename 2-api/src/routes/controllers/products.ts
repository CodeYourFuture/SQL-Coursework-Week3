import { Request, Response } from 'express';
import { createProduct, findProducts } from '../../contexts/products';

export function getProducts(req: Request, res: Response) {
  const searchQuery = req.query.name as string;

  findProducts(searchQuery)
    .then((result) => {
      if (result.rows.length === 0) {
        res.status(404).send({
          message: 'No products found',
        });
      } else {
        res.status(200).send(result.rows);
      }
    })
    .catch((err) => {
      res.status(500).send({ message: err.message });
    });
}

export function addProduct(req: Request, res: Response) {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({
      error: 'Missing required fields',
    });
  }

  createProduct(name)
    .then((result) => {
      if (result.rows.length > 0) {
        res.status(200).send(...result.rows);
      }
    })
    .catch((error: Error) => {
      res.status(400).send(error.message);
    });
}
