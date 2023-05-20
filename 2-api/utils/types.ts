export type ClientType = {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
  ssl: {
    rejectUnauthorized: boolean;
  };
};
