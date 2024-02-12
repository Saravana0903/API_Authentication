const express = require('express')
const app = express()
const PORT = 3005;
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path')
// const bcrypt = require('bcrypt')
app.use(cors());
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname,'users.db')
let db = null;
const initializeServer = async () => {
    try {
    db = await open({
        filename: dbpath,
        driver: sqlite3.Database
    })
}
  catch(e) {
    console.log(`promise is rejected due to error ${e.message}`);
    process.exit(1);
  }
}
initializeServer();

app.post('/users/register', async (req,res) => {
    const {username,password,age,gender,location} = req.body;
    const q1 = `select * from user where username = '${username}' ;`;
    // const hashedpwd = await bcrypt.hash(password,10);
    const qres = await db.get(q1);
    if (qres === undefined){
        const q2  = `
        insert into user(username,password,age,gender,location)
        values(
            '${username}',
            '${password}',
             ${age},
            '${gender}',
            '${location}'
        );`;
        const dbres = await db.run(q2);
        const userId = dbres.lastID;
        res.send({userId});
    }
    else{
        res.status = 400;
        res.send('User already exists');
    }
})

app.post('/users/login/',async (req,res) => {
    let jwttoken
    const {username,password} = req.body;
    const q1 = `select * from user where username='${username}';`;
    const dbres1 = await db.get(q1);
    if (dbres1 === undefined){
        res.status = 400;
        res.send('No such user exists!')
    }
    else{
        //const unhashedpwd = await bcrypt.compare(password,dbres1.password);
        if (password === dbres1.password){
            const payload = {
                username
            }
            jwttoken = jwt.sign(payload,'MY_TOKEN_AUTH'); 
            res.send({jwttoken})
            //res.send("user logged in succesfully")
        }
        else{
            res.status = 400;
            res.send('invalid password');
        }
    }
})


app.get('/users/', async (req,res) => {
    let jwttoken;
    const authHeader = req.headers['authorization'];
    console.log(authHeader);
    if (authHeader === undefined){
        res.status = 400;
        res.send('User not authorized');
    }
    else{
        jwttoken = authHeader.split(" ")[1];
        if (jwttoken === undefined){
            res.status = 401;
            res.send('Bad gateway request')
        }
        else{
            jwt.verify(jwttoken,'MY_TOKEN_AUTH', async (error,payload)  => {
                if (error){
                    res.status = 404;
                    res.send('Invalid JWT token');
                }
                else{
                    const query = `
                    select * from user;
                    `
                    const dbRes = await db.all(query);
                    res.send(dbRes);
                }
            });


        }
    }
})
app.listen(PORT,() => {
    console.log('Server Started at respective port');
});

