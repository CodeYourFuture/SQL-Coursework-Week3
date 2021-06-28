const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
//Body Parser Middleware


const welcomeMessage = {
    id: "abc",
    from: "Bart",
    text: "Welcome to CYF chat system!",
};

//This array is our "data store".
//We will start with one message in the array.
//Note: messages will be lost when Glitch restarts our server.
const messages = [welcomeMessage];

app.get("/", function (request, response) {
    response.sendFile(__dirname + "/index.html");
});





app.listen(PORT, () => console.log(`Server started on port ${PORT}`));