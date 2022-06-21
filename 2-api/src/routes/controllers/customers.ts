import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { createCustomer, findAllCustomers, findCustomerById } from '../../contexts/customers';

export function getCustomers(_req: Request, res: Response) {
  findAllCustomers()
    .then((result) => {
      if (result.rows.length > 0) {
        res.send(result.rows);
      } else {
        res.status(400).send({ message: 'Could not find customers' });
      }
    })
    .catch((err:Error) => {
      res.status(400).send({ message: err.message });
    });
}

export function getCustomerById(req: Request, res: Response) {
  const { customerId } = req.params;

  findCustomerById(customerId)
    .then((result: QueryResult) => {
      if (result.rows.length > 0) {
        res.status(200).json(...result.rows);
      } else {
        res.status(400).json({ message: 'Customer not found' });
      }
    })
    .catch((error: Error) => {
      res.status(400).json({ message: error.message });
    });
}

export function addCustomer(req: Request, res: Response) {
  const {
    name, address, city, country,
  } = req.body;

  if (!name || !address || !city || !country) {
    res.status(400).json({
      error: 'Missing required fields',
    });
  }

  createCustomer(name, address, city, country)
    .then((result) => {
      res.send(...result.rows);
    })
    .catch((error: Error) => {
      res.status(400).send({ message: error.message });
    });
}
