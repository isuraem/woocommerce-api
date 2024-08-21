const express = require('express');
const app = express();
require('dotenv').config();

var appController = require("./app/app");

const port = process.env.PORT;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`PORT: ${port}`);
});

app.use("/api", appController);
