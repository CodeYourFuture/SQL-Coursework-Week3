//routes,
// app.get("/hotels", function(req, res) {
//   pool.query('SELECT * FROM hotels')
//       .then((result) => res.json(result.rows))
//       .catch((error) => {
//           console.error(error);
//           res.status(500).json(error);
//       });
// });
// app.post("/hotels", function (req, res) {
//   const newHotelName = req.body.name;
//   const newHotelRooms = req.body.rooms;
//   const newHotelPostcode = req.body.postcode;
//   if (!Number.isInteger(newHotelRooms) || newHotelRooms <= 0) {
//     return res
//       .status(400)
//       .send("The number of rooms should be a positive integer.");
//   }
//   pool
//     .query("SELECT * FROM hotels WHERE name=$1", [newHotelName])
//     .then((result) => {
//       if (result.rows.length > 0) {
//         return res
//           .status(400)
//           .send("An hotel with the same name already exists!");
//       } else {
//         const query =
//           "INSERT INTO hotels (name, rooms, postcode) VALUES ($1, $2, $3)";
//         pool
//           .query(query, [newHotelName, newHotelRooms, newHotelPostcode])
//           .then(() => res.send("Hotel created!"))
//           .catch((error) => {
//             console.error(error);
//             res.status(500).json(error);
//           });
//       }
//     });
// });
// //name, email, address, city, postcode, country
// app.post("/customers", function (req, res) {
//   const newCustomerName = req.body.name;
//   const newEmail = req.body.email;
//   const newAddress = req.body.address;
//   const newCity = req.body.city;
//   const newPostcode = req.body.postcode;
//   const newCountry = req.body.country;
//   pool
//   .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
//   .then((result) => {
//     if (result.rows.length > 0) {
//       return res
//         .status(400)
//         .send("An Customer with the same name already exists!");
//     } else {
//       const query =
//         "INSERT INTO customers (name, email, address, city, postcode, country) VALUES ($1, $2, $3)";
//       pool
//         .query(query, [newCustomerName, newAddress, newCity, newPostcode, newCountry])
//         .then(() => res.send("Customer created!"))
//         .catch((error) => {
//           console.error(error);
//           res.status(500).json(error);
//         });
//     }
//   });
// });
// // search hotel by id
// app.get("/hotels/:hotelId", function (req, res) {
// const hotelId = req.params.hotelId;
// pool
//   .query("SELECT * FROM hotels WHERE id=$1", [hotelId])
//   .then((result) => res.json(result.rows))
//   .catch((error) => {
//     console.error(error);
//     res.status(500).json(error);
//   });
// });
// app.get("/customers", function (req, res) {
// const customerNameQuery = req.query.name;
// let query = `SELECT * FROM customers ORDER BY name`;
// let params = [];
// if (customerNameQuery) {
//     query = `SELECT * FROM customers WHERE name LIKE $1 ORDER BY name`;
//     params.push(`%${customerNameQuery}%`);
// }
// pool
//   .query(query, params)
//   .then((result) => res.json(result.rows))
//   .catch((error) => {
//     console.error(error);
//     res.status(500).json(error);
//   });
// });
// app.get("/customers/:customerId", function (req, res) {
// const customerId = req.params.customerId;
// pool
//   .query("SELECT * FROM customers WHERE id=$1", [customerId])
//   .then((result) => res.json(result.rows))
//   .catch((error) => {
//     console.error(error);
//     res.status(500).json(error);
//   });
// });
// app.get("/customers/:customerId/bookings", function (req, res) {
// const customerId = req.params.customerId;
// pool
//   .query("SELECT * FROM customers c inner join bookings b on c.id = b.customer_id  WHERE c.id=$1", [customerId])
//   .then((result) => res.json(result.rows))
//   .catch((error) => {
//     console.error(error);
//     res.status(500).json(error);
//   });
// });
// // updating customers email
// app.put("/customers/:customerId", function (req, res) {
// const customerId = req.params.customerId;
// const newEmail = req.body.email;
// if(newEmail === "" || !newEmail.includes("@")){
//   return res
//       .status(400)
//       .send("Please insert a valid email address");
// }
// pool
//   .query("UPDATE customers SET email=$1 WHERE id=$2", [newEmail, customerId])
//   .then(() => res.send(`Customer ${customerId} updated!`))
//   .catch((error) => {
//     console.error(error);
//     res.status(500).json(error);
//   });
// });
// app.listen(port, function() {
//   console.log("Server is listening on port 3001. Ready to accept requests!");
// });

//DELETE
// app.delete("/customers/:customerId", function (req, res) {
//   const customerId = req.params.customerId;

//   pool
//     .query("DELETE FROM bookings WHERE customer_id=$1", [customerId])
//     .then(() => pool.query("DELETE FROM customers WHERE id=$1", [customerId]))
//     .then(() => res.send(`Customer ${customerId} deleted!`))
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json(error);
//     });
// });

// //DELETE 
// app.delete("/customers/:customerId", function (req, res) {
//   const customerId = req.params.customerId;

//   pool
//     .query("DELETE FROM customers WHERE id=$1", [customerId])
//     .then(() => res.send(`Customer ${customerId} deleted!`))
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json(error);
//     });
// });


// GET QUERY NAME

// app.get("/products/", function(req, res) {
//   const nameSearch = req.query.name;
//   let query = `SELECT * FROM products ORDER BY name`;
//   let params = [];
//   if(nameSearch){
//     query = 'SELECT * FROM products WHERE name LIKE $1 ORDER BY name';
//     params.push(`%{nameSearch}%`)
//   }

//   pool.query(query, params)
//   .then((result) => {
//     res.status(200).send(result.rows)
//   })
//   .catch((error) =>{
//     console.error(error)
//     res.status(500).send(error)
//   })
  
// });

 //GET WITH QUERY NAME

// app.get("/hotels", function (req, res) {
//   const hotelNameQuery = req.query.name;
//   let query = `SELECT * FROM hotels ORDER BY name`;
//   let params = [];
//   if (hotelNameQuery) {
//       query = `SELECT * FROM hotels WHERE name LIKE $1 ORDER BY name`;
//       params.push(`%${hotelNameQuery}%`);
//   }
  
//   pool
//     .query(query, params)
//     .then((result) => res.json(result.rows))
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json(error);
//     });
// });

//GET WITH QUERY
// app.get("/products", function (req, res) {
//   const prodId = req.query.name;

//   pool
//     .query("SELECT * FROM hotels WHERE id=$1", [prodId])
//     .then((result) => res.json(result.rows))
//     .catch((error) => {
//       console.error(error);
//       res.status(500).json(error);
//     });
// });