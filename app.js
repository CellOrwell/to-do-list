const express = require("express");
const mysql = require("mysql");
const os = require("os");
require("dotenv").config();

console.log(os.networkInterfaces());
// const localIP = os.networkInterfaces()['eth0'][0].address;
// const app = express();

// app.use(express.json());
//    password: "Bzh7p6r5LJZ*F#V",



var con = mysql.createConnection({
    host: "192.168.1.85",
    port: 3306,
    user: `toDoUser`,
    password: "Bzh7p6r5LJZ",
    database: "toDoDB"
});

con.connect(function(err) {
    if(err) throw err;
    console.log("Connected.");
});