const express = require("express");
const router = express.Router();
router.use(express.json());

// supplementary functions
const services = require("./productAvailabilityServices");
// pg Pool object
const pool = require("../config");

// GET "/products"
router.get("/", (req, res) => {
  pool
    .query("SELECT * FROM product_availability;")
    .then((result) => res.json(result.rows))
    .catch((e) => res.send(e));
});

// POST "/products"
router.post("/", async (req, res) => {
  const errors = await services.validateIncomingData(req.body);
  console.log(errors);
  if (errors.length > 0) {
    return res.send(errors);
  }

  const insertQuery = `INSERT INTO product_availability (prod_id, supp_id, unit_price) VALUES ($1, $2, $3);`;
  try {
    await pool.query(insertQuery, [...Object.values(req.body)]);
    res.send("Product created!");
  } catch (error) {
    res.send({ error: "Error: invalid product information!" });
  }
});

// GET ("/product_availability/{productId}")
router.get("/:productId", (req, res) => {
  const productId = Number(req.params.productId);
  const query = "SELECT * FROM product_availability WHERE prod_id=$1";
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
