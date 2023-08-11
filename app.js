const express = require("express");
const mysql = require("mysql");
require("dotenv").config();

// const app = express();

// app.use(express.json());
//    password: "",

console.log(process.env.DB_USERNAME);


var con = mysql.createConnection({
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

con.connect(function(err) {
    if(err) {
        console.log(`ERROR ${err.message}`);
        return;
    }
    console.log("Connected.");
});