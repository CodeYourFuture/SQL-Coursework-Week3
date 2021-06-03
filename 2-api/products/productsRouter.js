const express = require("express");
const router = express.Router();
router.use(express.json());
// pg Pool object
const pool = require("../config");
// supplementary functions
const services = require("./productsServices");

// GET "/products"
router.get("/", (req, res) => {
  const searchQuery = services.getProductByNameQuery(req.query.name);
  pool
    .query(searchQuery[0], searchQuery[1])
    .then((result) => res.json(result.rows))
    .catch((e) => res.send(e));
});

// POST "/products"
router.post("/", (req, res) => {
  const newProductInfo = Object.values(req.body);
  pool
    .query("SELECT * FROM products WHERE product_name=$1", [newProductInfo[0]])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A product with the same name already exists!");
      } else {
        const query = "INSERT INTO products (product_name) VALUES ($1)";
        pool
          .query(query, [newProductInfo[0]])
          .then(() => res.send("Product created!"))
          .catch((e) => res.send(e));
      }
    });
});

// GET ("/products/{productId}")
router.get("/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  const query = "SELECT * FROM products WHERE id = $1";
  pool.query(query, [productId]).then((result) => {
    if (result.rows.length === 0) {
      return res.status(404).send("The requested product does not exist!");
    } else {
      res
        .status(200)
        .send(result.rows)
        .catch((e) => res.send(e));
    }
  });
});

module.exports = router;
