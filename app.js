const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

app.use(express.json());

var con = mysql.createConnection({
    host: process.env.DB_HOSTNAME,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

con.connect(function(err) {
    if(err) {
        console.error(`ERROR ${err.message}`);
        return;
    }
    console.log("Connected.");
});

app.get("/users/:userId", (req, res) => {
    const userId = req.params.userId;
    const query = `SELECT * FROM users WHERE user_id = ${userId};`;

    con.query(query, (err, results) => {
        if (err) {
            console.error(`ERROR ${err.message}`);
            return;
        }
        console.log("Result! ", results);

        res.send(results);
    });
});

app.get("/lists/:listId", (req, res) => {
    const listId = req.params.listId;
    const query = `SELECT * FROM lists WHERE listID == ${userId}`;

    con.query(query, (err, results) => {
        if (err) {
            console.error(`ERROR ${err.message}`);
            return;
        }
        console.log("Result! ", results);
    });
});

app.get("/tasks/:taskId", (req, res) => {
    const taskId = req.params.taskId;
    const query = `SELECT * FROM tasks WHERE taskID == ${taskId}`;

    con.query(query, (err, results) => {
        if (err) {
            console.error(`ERROR ${err.message}`);
            return;
        }
        console.log("Result! ", results);
    });
});

app.get("/users/:userId", (req, res) => {
    const userId = req.params.userId;
    const query = `SELECT * FROM users WHERE userID == ${userId}`;

    con.query(query, (err, results) => {
        if (err) {
            console.error(`ERROR ${err.message}`);
            return;
        }
        console.log("Result! ", results);
    });
});

app.post("/addUser", async (req, res) => {
    const userInfo = req.body;
    const query = "INSERT INTO users(username, password) VALUES(?,?)";
    try{
        const hashPwd = await getPwd(req.body.password);
        con.query(query, [req.body.username, hashPwd], (err, result) => {
            if(err) {
                console.error(`Error executing query: ${err}`);
                res.status(500).json({'message': `Unexpected Server-Side Error: ${err}`});
            }
            res.status(200).json({'message': 'OK. Data stored'});
        });
    } catch (err) {
        res.status(500).json({'message': `Unexpected Server-Side Error: ${err}`});
    }
});

async function getPwd(enteredPwd) {
    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.SALT_ROUNDS));
        const hashPwd = await bcrypt.hash(enteredPwd, salt);
        return hashPwd;
    } catch (err) {
        console.error(`An error occurred: ${err}`);
        throw err;
    }
}

function checkPwd(username, enteredPwd) {
    const storedQuery = `SELECT password FROM users WHERE username = ?`;

    db.query(storedQuery, [username], (err, res) => {
        if(err) {
            console.error(`Error obtaining stored password: ${err}`);
            res.status(500).json({'message': `Unexpected Server-Side Error: ${err}`});
        }
        
        if(!res)
        {
            console.error("No user found.");
            res.status(404).json({'message': 'No User Found'});
        }

        bcrypt.compare(enteredPwd, res.password, (err, res) => {
            if(err) {
                console.error(`Error comparing passwords: ${err}`);
                res.status(500).json({'message': `Unexpected Server-Side Error: ${err}`});
            } else {
                if(res) {
                    console.log("Passwords match.");
                    return true;
                } else {
                    console.log("Passwords don't match.");
                    return false;
                }
            }
        });

        res.status(500).json({'message': 'Unexpected Server-Side Error'});
    });
}

app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
});