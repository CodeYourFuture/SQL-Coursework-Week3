const express = require("express");

const app = express();

const PORT = 3000 || process.env.PORT;

app.use(express.json());

app.use("/customers", require("./routes/api/customers"));
app.use("/products", require("./routes/api/products"));
app.use("/orders", require("./routes/api/orders"));
app.use("/suppliers", require("./routes/api/suppliers"));
app.use("/availability", require("./routes/api/productAvailability"));

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
