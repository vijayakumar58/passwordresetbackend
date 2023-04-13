const express = require("express");
const cors = require("cors");
const app = express();
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const dotenv = require("dotenv").config();
const URL = process.env.DB;
const DB = "passwordresetflow"
app.listen(process.env.PORT || 3000);

//middleware
app.use(express.json());
app.use(cors({
    origin : "*"
}))

app.get('/home', function(req,res){
    res.send("Welcome to Full-Stack Demo")
})

//create user
app.post('/user',async function(req,res){
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
app.get('/users', async function(req,res){
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
app.get('/user/:id', async function(req,res){
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
app.put('/user/:id', async function(req,res){
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
app.delete('/user/:id',async function(req,res){
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