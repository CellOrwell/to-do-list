const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const axios = require("axios");
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

function startDBCon() {
    con.connect(function(err) {
        if(err) {
            console.error(`ERROR ${err.message}`);
            return;
        }
        console.log("Connection Created.");
    });
}

function endDBCon() {
    con.end((err) => {
        if(err) {
            console.error(`ERROR: ${err.message}`);
            return;
        }
        console.log("Connection Terminated. I'm sorry to interrupt you, Elizabeth."); //Little FNAF easter egg for ya ;)
    });
}

// ================= Endpoints =================

// ================= Get Endpoints =================

// ================= User Get Endpoints =================

// Get user based off userId
app.get("/users/:userId?", (req, res) => {
    const userId = req.params.userId;
    let query = `SELECT * FROM users`;

    if(parseInt(userId)) {
        query += ` WHERE user_id = ?`;
    } else if (userId) {
        query += ` WHERE username = ?`;
    }

    query += ";";
    
    startDBCon();

    con.query(query, [userId], (err, results) => {
        endDBCon();
        if (err) {
            console.error(`ERROR ${err.message}. SQL Query is ${query}`);
            return;
        }
        
        if(results.length == 0) {
            res.status(404).json({'error': 'User Doesn\'t Exist'});
            return;
        }

        res.send(results);
    });
});

// ================= List Get Endpoints =================

// Get lists based off listId
app.get("/lists/fromList/:listId?", (req, res) => {
    const listId = req.params.listId;
    const query = `SELECT * FROM lists`;

    if(listId) {
        query += " WHERE list_id = ?";
    }

    query += ";";

    startDBCon();
    con.query(query, [listId], (err, results) => {
        endDBCon();
        if (err) {
            console.error(`ERROR ${err.message}`);
            return;
        }
        if(results.length == 0) {
            res.status(404).json({'error': 'List Doesn\'t Exist'});
            return;
        }

        res.send(results);
    });
});

// Get lists based off userID
app.get("/lists/fromUser/:userId?", (req, res) => {
    const userId = req.params.userId;
    const query = `SELECT * FROM lists`;

    if(userId) {
        query += " WHERE user_id = ?";
    }

    query += ";";

    startDBCon();
    con.query(query, [userId], (err, results) => {
        endDBCon();
        if (err) {
            console.error(`ERROR ${err.message}`);
            return;
        }
        
        if(results.length == 0) {
            res.status(404).json({'error': 'List Doesn\'t Exist'});
            return;
        }

        res.send(results);
    });
});

// ================= Task GET Endpoints =================

// Get tasks based off taskId
app.get("/tasks/:taskId?", (req, res) => {
    const taskId = req.params.taskId;
    const query = `SELECT * FROM tasks`;

    if(taskId) {
        query += " WHERE task_id = ?";
    }

    query += ";";

    startDBCon();
    con.query(query, [taskId], (err, results) => {
        endDBCon();
        if (err) {
            console.error(`ERROR ${err.message}`);
            return;
        }
        
        if(results.length == 0) {
            res.status(404).json({'error': 'Task Doesn\'t Exist'});
            return;
        }

        res.send(results);
    });
});

// Get tasks based off listId
app.get("/tasks/:listId?", (req, res) => {
    const listId = req.params.listId;
    const query = `SELECT * FROM tasks`;

    if(listId) {
        query += " WHERE list_id = ?";
    }

    query += ";";

    startDBCon();
    con.query(query, [listId], (err, results) => {
        endDBCon();
        if (err) {
            console.error(`ERROR ${err.message}`);
            return;
        }
        
        if(results.length == 0) {
            res.status(404).json({'error': 'Task Doesn\'t Exist'});
            return;
        }

        res.send(results);
    });
});

// ================= End of GET Endpoints =================

// ================= POST Endpoints =================

// ================= User POST Endpoints - SORT OUT USER VERIFICATION && Figure out if it's better to use UserID or username. =================

// Add User
// Info sent: Username and Password
app.post("/addUser", async (req, res) => {
    const userInfo = req.body;
    const query = "INSERT INTO users(username, password) VALUES(?,?)";
    try{
        startDBCon();
        const hashPwd = await getPwd(req.body.password);
        con.query(query, [req.body.username, hashPwd], (err, result) => {
            endDBCon();
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

// Remove User
// Info sent: Verification
app.post("/remUser", async (req, res) => {
    const userId = req.body.userId;
    const query = `DELETE FROM users WHERE user_id = ?`;
    startDBCon();
    try {
        con.query(query, [userId], (err, result) => {
            endDBCon();
            if(err) {
                console.error(`Error executing query: ${err}`);
                res.status(500).json({'message': `Unexpected Server-Side Error: ${err}`});
            }
            res.status(200).json({'message': 'OK. Data deleted'});
        });
    } catch (err) {
        res.status(500).json({'message': `Unexpected Server-Side Error: ${err}`});
    }
});

// Verify User
// Info sent: Username and Password
app.post("/verifyUser", async (req, res) => {
    const user = req.body.username;
    const pwd = req.body.password;

    if(!user || !pwd)
    {
        res.status(404).json({'message': 'Parameters missing'});
        return;
    }

    // let query = "SELECT password FROM users WHERE user_id = ?;";
    try{
        if(await checkPwd(user, pwd)) {
            res.status(200).json({"message": "VERIFIED"});
        } else {
            res.status(200).json({"message": "UNVERIFIED"});
        }
    } catch (err) {
        res.status(500).json({"message": `Unexpected Server-Side Error: ${err}`});
    }
})

// Update User Property (Username or Password)
// Info sent: Old Username and Password, New Username/Password, Verification, Property to Change

app.post("/updateUser", async (req, res) => {
    const user = req.body.username;
    const pwd = req.body.password;
    const newUser = req.body.newUser;
    const toSet = req.body.toSet;
    const query = `UPDATE users SET ${toSet} = ? WHERE username = ?;`;
    let dataChange = "";

    startDBCon();

    axios.post("http://localhost:3000/verifyUser", {"username": user, "password": pwd})
        .then(async response => {
            endDBCon();
            console.log("User Verification: ", response.data.message);

            if(toSet === "password") {
                dataChange = await getPwd(newUser);
            } else {
                dataChange = newUser;
            }
            startDBCon();
            if(response.data.message == "VERIFIED") {
                con.query(query, [dataChange, user], (err, result) => {
                    endDBCon();
                    if(err) {
                        console.error(`Error executing query: ${err}`);
                        res.status(500).json({'message': `Unexpected Server-Side Error: ${err}`});
                        return;
                    }
                    res.status(200).json({'message': `OK. ${toSet} updated`});
                });
            }
        }).catch(error => {
            console.error(`Error verifying data: ${err}`);
            res.status(500).json({'message': `Unexpected Server-Side Error: ${err}`});
        })
})

// ================= List POST Requests =================

// Add List
// Info Sent: UserID, Title, Description?

// Remove List
// Info Sent: UserID, ListID

// Update List Property (Title or Description)
// Info Sent: UserID, ListID, What to Change, What to Change To

// ================= Task POST Requests =================

// Create Task
// Info Sent: UserID, Title, Description?, Due Date?, Priority?

// Remove Task
// Info Sent: UserID(maybe), TaskID, ListID, Verification

// Update Task Properties (Title, Description)
// Info Sent: TaskID, What to Change, What to Change to

// Update List Task is In
// Info Sent: TaskID, NewListID(maybe name)

// Update Task Due Date
// Info Sent: TaskID, NewDate

// Update Task Completion
// Info Sent: TaskID, newIsDone

// Update Priority of Task
// Info Sent: TaskID, newPriority

// ================= End of POST Endpoints =================

// ================= End of Endpoints =================
 

// ================= Password Hashing Functions =================

// Get Hashed Password
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

// Check Inputted Password Against Stored Hashed Password
async function checkPwd(username, enteredPwd) {
    const storedQuery = `SELECT password FROM users WHERE username = ?;`;

    try{
        const result = await new Promise((resolve, reject) => {
            con.query(storedQuery, [username], (err, res) => {
                if (err) {
                    console.error(`Error obtaining stored password: ${err}`);
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
        
        if(result.length === 0)
        {
            console.error("No user found.");
            throw new Error("No user found");
        }

        const pwordMatch = await bcrypt.compare(enteredPwd, result[0].password)
        if(pwordMatch) {
            console.log("Passwords match.");
            return true;
        } else {
            console.log("Passwords don't match.");
            return false;
        }
    } catch (err) {
        console.error(err);
    }
}

//App Start - Make it listen on port
app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
});