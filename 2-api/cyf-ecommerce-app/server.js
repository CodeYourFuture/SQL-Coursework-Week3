const express = require("express");
const appRouter = require("./routes");
const app = express();


//app.use(cors());
//app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/", appRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Start server port: ${PORT}`));
