/* eslint-disable @typescript-eslint/naming-convention */
import { Request, Response } from 'express';
import { QueryResult } from 'pg';
import { findCustomerById } from '../../contexts/customers';
import { addOrder, getOrderById, findAndDeleteOrder } from '../../contexts/orders';

export async function createOrder(req: Request, res: Response) {
  const { customerId } = req.params;

  const customer = await findCustomerById(customerId).then(
    (result) => result.rows,
  );

  if (!customer) {
    res.status(400).send({ message: 'Customer not found' });
    res.end();
  }

  addOrder(customerId).then((result: QueryResult) => {
    res.send(...result.rows);
  });
}

export async function deleteOrder(req: Request, res: Response) {
  const { orderId } = req.params;

  getOrderById(orderId).then((result: QueryResult) => {
    if (result.rows.length === 0) {
      res.status(404).send({ message: 'Order does not exist' });
    } else {
      findAndDeleteOrder(orderId)
        .then(() => {
          res.status(200).send({ message: 'Order deleted' });
        })
        .catch((err) => {
          res.status(400).send({ message: err.message });
        });
    }
  });
}
