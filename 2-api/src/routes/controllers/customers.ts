import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import {
  createCustomer,
  findAllCustomers,
  findAndDeleteCustomer,
  findAndUpdateCustomer,
  findCustomerById,
  findCustomerByIdAndOrderItems,
} from '../../contexts/customers';
import { findOrdersByCustomerId } from '../../contexts/orders';

export function getCustomers(_req: Request, res: Response) {
  findAllCustomers()
    .then((result) => {
      if (result.rows.length > 0) {
        res.send(result.rows);
      } else {
        res.status(400).send({ message: 'Could not find customers' });
      }
    })
    .catch((err: Error) => {
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

export function getCustomerByIdWithOrderItems(req: Request, res: Response) {
  const { customerId } = req.params;

  findCustomerByIdAndOrderItems(customerId)
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

export function updateCustomer(req: Request, res: Response) {
  const { customerId } = req.params;
  const {
    name, address, city, country,
  } = req.body;

  if (!customerId || !Number(customerId)) {
    res.status(400).json({
      error: 'Missing CustomerId',
    });
  }

  findAndUpdateCustomer(customerId, {
    name,
    address,
    city,
    country,
  })
    .then((result) => {
      res.send(...result.rows);
    })
    .catch((error: Error) => {
      res.status(400).send({ message: error.message });
    });
}

export async function deleteCustomer(req: Request, res: Response) {
  const { customerId } = req.params;

  findOrdersByCustomerId(customerId).then((result) => {
    if (result.rows.length > 0) {
      res
        .status(400)
        .send({ message: 'Customer has orders, cannot be deleted.' });
    } else {
      findAndDeleteCustomer(customerId)
        .then(() => {
          res.status(200).send({ message: 'Customer deleted successfully.' });
        })
        .catch((error: Error) => {
          res.status(400).send({ message: error.message });
        });
    }
  });
}
