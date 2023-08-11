const express = require("express");
const mysql = require("mysql");
require("dotenv").config();

// const app = express();

// app.use(express.json());
//    password: "",



var con = mysql.createConnection({
    host: "192.168.1.85",
    port: 3306,
    user: `toDoUser`,
    password: "",
    database: "toDoDB"
});

con.connect(function(err) {
    if(err) throw err;
    console.log("Connected.");
});