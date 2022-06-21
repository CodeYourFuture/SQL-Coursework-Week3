/* eslint-disable @typescript-eslint/naming-convention */
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { findCustomerById } from '../../contexts/customers';
import { addOrder } from '../../contexts/orders';

export async function createOrder(req: Request, res: Response) {
  const { customerId } = req.params;

  const customer = await findCustomerById(customerId).then((result) => result.rows);

  if (!customer) {
    res.status(400).send({ message: 'Customer not found' });
    res.end();
  }

  addOrder(customerId).then((result:QueryResult) => {
    res.send(...result.rows);
  });
}
