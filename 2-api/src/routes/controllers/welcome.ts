import { Response, Request } from 'express';

export default function welcome(_req:Request, res:Response):void {
  res.send('Welcome to my api');
}
