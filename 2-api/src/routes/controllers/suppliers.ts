import { Request, Response } from 'express';
import { findAllSuppliers } from '../../contexts/suppliers';

export function getSuppliers(_req: Request, res: Response) {
  findAllSuppliers()
    .then((result) => {
      if (result.rows.length === 0) {
        res.status(404).send({
          message: 'Suppliers not found',
        });
      } else {
        res.status(200).send(result.rows);
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message,
      });
    });
}
