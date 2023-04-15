const express = require("express");
const cors = require("cors");
const app = express();
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const URL = process.env.DB;
const DB = "passwordresetflow"
app.listen(process.env.PORT || 3000);

//middleware
app.use(express.json());
app.use(cors({
    origin : "*"
}))

const Authenticate = (req,res,next) => {
    if (req.headers.authorization) {
        next()
    } else {
        res.status(401).json({message:"UnAuthorized"})
    }
}

app.get('/',Authenticate, function(req,res){
    res.send("Welcome to Password Reset Flow")
})

//create user
app.post('/user',Authenticate, async function(req,res){
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        await db.collection('users').insertOne(req.body);
        await connection.close();
        res.json({message:"User Data Insert"})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"Something Went Wrong"})
    }
})

//get users
app.get('/users',Authenticate, async function(req,res){
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const resUser = await db.collection('users').find().toArray();
        await connection.close();
        res.json(resUser);
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Something Went Wrong"})
    }
})

//view user
app.get('/user/:id',Authenticate, async function(req,res){
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const user = await db.collection('users').findOne({ _id: new mongodb.ObjectId(req.params.id) });
        await connection.close();
        res.json(user);
    } catch (error) {
        res.status(500).json({message:"Something Went Wrong"})
    }
})

//Edit user
app.put('/user/:id',Authenticate, async function(req,res){
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const view = await db.collection('users').findOneAndUpdate({_id: new mongodb.ObjectId(req.params.id)},{$set:req.body});
        await connection.close();
        res.json(view);
    } catch (error) {
        res.status(500).json({message:"Something Went Wrong"})
    }
})

//Delete user
app.delete('/user/:id',Authenticate, async function(req,res){
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const user = await db.collection('users').findOneAndDelete({ _id: new mongodb.ObjectId(req.params.id)});
        await connection.close();
        res.json(user);
    } catch (error) {
        res.status(500).json({message:"Something Went Wrong"})
    }
})

//create registerui
app.post('/createregister',async function(req,res){
    try{
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password,salt);
        req.body.password = hash;
        await db.collection('registerui').insertOne(req.body);
        await connection.close();
        res.json({message:"registerui insert successfully"})
    } catch (error) {
        console.log(error)
        res.status(500).json({message:"something went wrong"});
    }
})

//login 
app.post('/login',async function(req,res){
    try {
        const connection = await mongoClient.connect(URL);
        const db = connection.db(DB);
        const user = await db.collection('registerui').findOne({email:req.body.email});
        if (user) {
            const compare = await bcrypt.compare(req.body.password,user.password);
            if (compare) {
                const token = jwt.sign({_id:user._id},"asdfghjkl",{expiresIn:"10m"})
            } else {
                res.json({message:"Enter correct Email/Password"})
            }
        } else {
            res.status(401).json({message:"Enter correct Email/password"})
        }
        await connection.close();
    } catch (error) {
        res.status(500).json({message:"Something Went Wrong"})
    }
})