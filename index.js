const express = require('express');
import dotenv from "dotenv";

const app = express();
dotenv.config();

app.listen(9884, () => {
    console.log("Server started on port 9884");
});