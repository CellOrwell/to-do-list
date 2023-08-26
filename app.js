const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json());

function startDBCon() {
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
        console.log("Connection Created.");
    });

    return con;
}

function endDBCon(con) {
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
    
    const con = startDBCon();

    con.query(query, [userId], (err, results) => {
        endDBCon(con);
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
    let query = `SELECT * FROM lists`;

    if(listId) {
        query += " WHERE list_id = ?";
    }

    query += ";";

    const con = startDBCon();
    con.query(query, [listId], (err, results) => {
        endDBCon(con);
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
    let query = `SELECT * FROM lists`;

    if(userId) {
        query += " WHERE user_id = ?";
    }

    query += ";";

    const con = startDBCon();
    con.query(query, [userId], (err, results) => {
        endDBCon(con);
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
app.get("/tasks/fromTask/:taskId?", (req, res) => {
    const taskId = req.params.taskId;
    let query = `SELECT * FROM tasks`;

    if(taskId) {
        query += " WHERE task_id = ?";
    }

    query += ";";

    const con = startDBCon();
    con.query(query, [taskId], (err, results) => {
        endDBCon(con); 
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
app.get("/tasks/fromList/:listId?", (req, res) => {
    const listId = req.params.listId;
    let query = `SELECT * FROM tasks`;

    if(listId) {
        query += " WHERE list_id = ?";
    }

    query += ";";

    const con = startDBCon();
    con.query(query, [listId], (err, results) => {
        endDBCon(con);
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
        const con = startDBCon();
        const hashPwd = await getPwd(req.body.password);
        con.query(query, [req.body.username, hashPwd], (err, result) => {
            if(err) {
                serverErr(err, res);
                return;
            }
            dataAdded("User", res);
        });
    } catch (err) {
        serverErr(err, res);
    } finally {
        endDBCon(con);
    }
});

// Remove User
// Info sent: Verification
app.post("/remUser", async (req, res) => {
    const userId = req.body.userId;
    const query = `DELETE FROM users WHERE user_id = ?`;
    const con = startDBCon();
    try {
        con.query(query, [userId], (err, result) => {
            
            if(err) {
                serverErr(err, res);
                return;
            }
            dataRemoved("User", res);
        });
    } catch (err) {
        serverErr(err, res);
    } finally {
        endDBCon(con);
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
        serverErr(err, res);
    }
});

// Update User Property (Username or Password)
// Info sent: Old Username and Password, New Username/Password, Verification, Property to Change

app.post("/updateUser", async (req, res) => {
    const user = req.body.username;
    const pwd = req.body.password;
    const newUser = req.body.newUser;
    const toSet = req.body.toSet;
    const query = `UPDATE users SET ${toSet} = ? WHERE username = ?;`;
    let dataChange = "";

    axios.post("http://localhost:3000/verifyUser", {"username": user, "password": pwd})
        .then(async response => {
            console.log("User Verification: ", response.data.message);

            if(toSet === "password") {
                dataChange = await getPwd(newUser);
            } else {
                dataChange = newUser;
            }
            const con = startDBCon();
            if(response.data.message == "VERIFIED") {
                con.query(query, [dataChange, user], (err, result) => {
                    endDBCon(con);
                    if(err) {
                        serverErr(err, res);
                        return;
                    }
                    dataUpdated(`${toSet} in User`, res);
                });
            }


        }).catch(error => {
            serverErr(error, res);
        })
})

// ================= List POST Requests =================

// Add List
// Info Sent: UserID, Title, Description?

app.post("/addList", (req, res) => {
    const user = req.body.user_id;
    const title = req.body.title;
    let description = "";
    if(req.body.hasOwnProperty("description"))
    {
        description = req.body.description;
    }
    const query = `INSERT INTO lists(user_id, title, description) VALUES (?,?,?);`;

    const con = startDBCon();

    con.query(query, [user, title, description], (err, result) => {
        endDBCon(con);
        if(err) {
            serverErr(err, res);
            return;
        }

        dataAdded("List", res);
    });

})

// Remove List
// Info Sent: UserID, ListID

app.post("/remList", (req, res) => {
    const listId = req.body.list_id;
    const query = `REMOVE FROM lists WHERE list_id = ?;`;

    const con = startDBCon();

    con.query(query, [listId], (err, result) => {
        endDBCon(con);
        if(err) {
            serverErr(err, res);
            return;
        }

        dataRemoved("List", res);
    });

})

// Update List Property (Title or Description)
// Info Sent: UserID, ListID, What to Change, What to Change To

app.post("/updateList", (req, res) => {
    const listId = req.body.list_id;
    //toSet = title or description
    const toSet = req.body.to_set;
    const newValue = req.body.new_value
    const query = `UPDATE lists SET ${toSet} = ? WHERE list_id = ;`;

    const con = startDBCon();

    con.query(query, [newValue, listId], (err, result) => {
        endDBCon(con);
        if(err) {
            serverErr(err, res);
            return;
        }

        dataUpdated(`${toSet} in List`, res);
    });

})

// ================= Task POST Requests =================

// Create Task
// Info Sent: listID, Title, Description?, Due Date?, Priority?

app.post("/createTask", (req, res) => {
    const listId = req.body.list_id;
    const title = req.body.title;
    let description = ifExists(req.body, "description") || null;
    let dueDate = Date.parse(ifExists(req.body, "due_date")) || null;
    let taskPriority = ifExists(req.body, "task_priority") || null;

    const query = `INSERT INTO tasks(list_id, title, description, dueDate, priority, isDone) VALUES(?, ?, ?, ?, ?, false);`;

    const con = startDBCon();

    con.query(query, [listId, title, description, dueDate, taskPriority], (err, result) => {
        endDBCon(con);
        if(err) {
            serverErr(err, res);
            return;
        }

        dataAdded("Task", res);
    });

})

// Remove Task
// Info Sent: UserID(maybe), TaskID, ListID

app.post("/removeTask", (req, res) => {
    const taskId = req.body.task_id;
    const query = `DELETE FROM tasks WHERE task_id = ?;`;

    const con = startDBCon();

    con.query(query, [taskId], (err, result) => {
        endDBCon(con);
        if(err) {
            serverErr(err, res);
            return;
        }

        dataRemoved("Task", res);
    });

})

// Update Task Properties (Title, Description)
// Info Sent: TaskID, What to Change, What to Change to

app.post("/updateTaskText", (req, res) => {
    const taskId = req.body.task_id;
    const toSet = req.body.to_set;
    let newSet;

    if(toSet === "dueDate") {
        newSet = Date.parse(req.body.new_set);
    } else {
        newSet = req.body.new_set;
    }

    const query = `UPDATE tasks SET ${toSet} = ? WHERE task_id = ?;`;

    const con = startDBCon();

    con.query(query, [newSet, taskId], (err, result) => {
        endDBCon(con);
        if(err) {
            serverErr(err, res);
            return;
        }

        dataUpdated(`${toSet} in Task Updated`, res);
    });

})

// Update List Task is In
// Info Sent: TaskID, NewListID(maybe name)

app.post("/updateTaskList", (req, res) => {
    const taskId = req.body.task_id;
    const list_name = req.body.list_name;

    const queryListID = "SELECT list_id FROM lists WHERE title = ?;";
    const queryUpdate = `UPDATE tasks SET list_id = ? WHERE task_id = ?`;

    const con = startDBCon();

    con.query(queryListID, [list_name], (err, result) => {
        endDBCon(con);
        if(err) {
            serverErr(err, res);
            return;
        }

        console.log(res);
        dataUpdated("New List in Task Updated", res);
    });
})

// Update Task Due Date -- Might not have to do this
// Info Sent: TaskID, NewDate

// Swap Task Completion
// Info Sent: TaskID

// Update Priority of Task
// Info Sent: TaskID, newPriority

// ================= End of POST Endpoints =================

// ================= End of Endpoints =================
 
// ================= Message Functions =================

function serverErr(err, res) {
    console.error(`Error Executing Query: ${err}`);
    res.status(500).json({'message': `Unexpected Server-Side Error: ${err}`});
}

function dataAdded(data, res) {
    res.status(200).json({"message": `${data} Added`});
}

function dataRemoved(data, res) {
    res.status(200).json({'message': `OK. ${data} deleted`});
}

function dataUpdated(data, res) {
    res.status(200).json({"message": `${data} Updated`});
}

function ifExists(variables, searchFor) {
    if(variables.hasOwnProperty(searchFor)) {
        return variables[searchFor];
    }

    return null;
}

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
        const con = startDBCon();
        const result = await new Promise((resolve, reject) => {
            con.query(storedQuery, [username], (err, res) => {
                endDBCon(con);
                
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

// ================= App Start - Make it listen on port =================
app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}`);
});