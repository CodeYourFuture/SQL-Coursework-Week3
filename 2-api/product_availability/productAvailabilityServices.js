const pool = require("../config");

// QUERIES
const QUERIES = {
  duplicateDataQuery: `SELECT prod_id, supp_id FROM product_availability WHERE prod_id = $1 AND supp_id = $2;`,
  productNotFoundQuery: `SELECT * FROM products WHERE id = $1;`,
  supplierNotFoundQuery: `SELECT * FROM suppliers WHERE id = $1;`,
};

async function validateIncomingData(data) {
  const [productId, supplierId, unitPrice] = Object.values(data);
  const errors = [];
  if (!unitPrice || !productId || !supplierId) {
    return errors.push({
      error: "Error: missing product id or supplier id information!",
    });
  }
  if (!Number.isInteger(unitPrice) || unitPrice < 0) {
    return [{ error: "Error: invalid product unit price value!" }];
  }
  try {
    let result = await pool.query(QUERIES.productNotFoundQuery, [productId]);

    if (result.rowCount === 0) {
      errors.push({
        error: "Error: the product specified does not exist.",
      });
    }
    result = await pool.query(QUERIES.supplierNotFoundQuery, [supplierId]);
    if (result.rowCount === 0) {
      errors.push({
        error: "Error: the supplier specified does not exist.",
      });
    }
    return errors;
  } catch  {
    return [{ error: "Error: invalid product information!" }];
  }
}

// function addNewData([productId, supplierId, unitPrice]) {
//   return pool
//     .query(QUERIES.insertQuery, [productId, supplierId, unitPrice])
//     .then(() => res.send("Product created!"))
//     .catch(() => res.sendStatus(500));
// }

module.exports = { validateIncomingData };
