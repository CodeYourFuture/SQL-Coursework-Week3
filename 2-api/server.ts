import express, { Express } from "express";
import { Client } from "pg";
import { clientConfig } from "./utils/clientConfig";
import customerRoutes from "./routes/customers";
import availabilityRoutes from "./routes/availabilities";
import productRoutes from "./routes/products";
import suppliers from "./routes/suppliers";
import orderRoutes from "./routes/orders";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

export const client = new Client(clientConfig);
client.connect();
app.use("/customers", customerRoutes);
app.use("/suppliers", suppliers);
app.use("/products", productRoutes);
app.use("/availability", availabilityRoutes);
app.use("/orders", orderRoutes);

app.listen(3000, () => console.log("Server is listening on port 3000."));
