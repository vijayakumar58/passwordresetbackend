const express = require("express");
const cors = require("cors");
const app = express();
const nodemailer = require("nodemailer");
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const URL = process.env.DB;
const DB = "passwordresetflow";
const semail = process.env.EMAIL;
const spassword = process.env.PASSWORD
app.listen(process.env.PORT || 3000);

//middleware
app.use(express.json());
app.use(cors({
    // origin: "http://localhost:3001"
    origin: "https://passwordreset-email.netlify.app"
}))

const Authenticate = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const decode = jwt.verify(req.headers.authorization, process.env.SECRET);
            if (decode) {
                next()
            }
        } catch (error) {
            res.status(401).json({ message: "UnAuthorized" })
        }
    } else {
        res.status(401).json({ message: "UnAuthorized" })
    }
};

app.get('/', function (req, res) {
    res.send("Welcome to Password Reset Flow")
})

//create user
app.post('/user', Authenticate, async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        await db.collection('users').insertOne(req.body);
        await connection.close();
        res.json({ message: "User Data Insert" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something Went Wrong" })
    }
})

//get users
app.get('/users', Authenticate, async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const resUser = await db.collection('users').find().toArray();
        await connection.close();
        res.json(resUser);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something Went Wrong" })
    }
})

//view user
app.get('/user/:id', Authenticate, async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const user = await db.collection('users').findOne({ _id: new mongodb.ObjectId(req.params.id) });
        await connection.close();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Something Went Wrong" })
    }
})

//Edit user
app.put('/user/:id', Authenticate, async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const view = await db.collection('users').findOneAndUpdate({ _id: new mongodb.ObjectId(req.params.id) }, { $set: req.body });
        await connection.close();
        res.json(view);
    } catch (error) {
        res.status(500).json({ message: "Something Went Wrong" })
    }
})

//Delete user
app.delete('/user/:id', Authenticate, async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const user = await db.collection('users').findOneAndDelete({ _id: new mongodb.ObjectId(req.params.id) });
        await connection.close();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Something Went Wrong" })
    }
})

//create registerui
app.post('/createregister', async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        req.body.repeatpassword = hash;
        await db.collection('registerui').insertOne(req.body);
        await connection.close();
        res.json({ message: "registerui insert successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "something went wrong" });
    }
})

//login 
app.post('/login', async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const user = await db.collection('registerui').findOne({ email: req.body.email });
        if (user) {
            const compare = await bcrypt.compare(req.body.password, user.password);
            if (compare) {
                const token = jwt.sign({ _id: user._id }, process.env.SECRET, { expiresIn: "10m" })
                res.json({ token })
            } else {
                console.log(error)
                res.json({ message: "Enter correct Password" })
            }
        } else {
            console.log(error)
            res.status(401).json({ message: "Enter correct Email" })
        }
        await connection.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Something Went Wrong" })
    }
})

//Nodemailer Function
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: semail,
        pass: spassword
    },
});

//Forgot password & email verification
app.post('/ForgotPassword', async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const user = await db.collection('registerui').findOne({ email: req.body.email })
        if (user) {
            const token = jwt.sign({ _id: user._id }, process.env.SECRET, { expiresIn: "5m" })
            await db.collection('registerui').updateOne({ _id: user._id }, { $set: { verifytoken: token } })

            const mailOption = {
                from: semail,
                to: `${user.email}`,
                subject: "Send Email For Password Reset",
                text: `This link is valid for 5 minutes: https://passwordreset-email.netlify.app/Resetpassword/${user._id}/${token}`
                // text: `This link is valid for 5 minutes: http://localhost:3001/Resetpassword/${user._id}/${token}`
            }

            await transporter.sendMail(mailOption, (error, info) => {
                if (error) {
                    console.log("Error : ", error);
                    return res.status(401).json({ message: "Email Not Send" })
                } else {
                    console.log("Email sent : ", info.response);
                    return res.status(201).json({ message: "Email has been send successfully" })
                }
            });
        } else {
            res.status(401).json({ message: "User not found" })
        }
        await connection.close()
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" })
    }
})

//Verify user for forgot password Time
app.get('/Resetpassword/:id/:token', async (req, res) => {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const verifytoken = jwt.verify(req.params.token, process.env.SECRET)
        const validuser = await db.collection('registerui').findOne({ _id: new mongodb.ObjectId(req.params.id), verifytoken: req.params.token })

        if (validuser && verifytoken._id == req.params.id) {
            res.status(201).json({ status: 201, validuser })
        } else {
            res.status(401).json({ status: 401, message: "User not found or token mismatch" })
        }
        await connection.close()
    } catch (error) {
        console.log("Verify Error:", error.message);
        res.status(401).json({ status: 401, message: "Token Expired or Invalid", error: error.message })
    }
})

//New password update
app.put('/Resetpassword/:id/:token', async function (req, res) {
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const verifytoken = jwt.verify(req.params.token, process.env.SECRET)
        const validuser = await db.collection('registerui').findOne({ _id: new mongodb.ObjectId(req.params.id), verifytoken: req.params.token });

        if (validuser && verifytoken._id == req.params.id) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(req.body.password, salt);
            await db.collection('registerui').updateOne({ _id: new mongodb.ObjectId(req.params.id) }, { $set: { password: hash, verifytoken: "" } })
            res.status(201).json({ message: "Password updated successfully" })
        } else {
            res.status(401).json({ message: "User identity mismatch or token invalid" })
        }
        await connection.close()
    } catch (error) {
        console.log("Update Error:", error.message);
        res.status(401).json({ message: "Token Expired or Invalid", error: error.message })
    }
})