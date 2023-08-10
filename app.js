const express = require("express");
const mysql = require("mysql");
require("dotenv").config();

const app = express();

app.use(express.json());