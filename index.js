require("dotenv").config();
const express = require('express');
const app = express()

const cors = require('cors')
const { param } = require('express/lib/request');

const mongodb = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const mongoClient = mongodb.MongoClient;
const URL = 'mongodb+srv://Ragul_praveen:tPyNQTVF5hH5tvz0@cluster0.a8imc.mongodb.net/zenclass?retryWrites=true&w=majority';
const port = process.env.PORT || 3001


app.use(
    cors({
        origin: '*'
    })
);
app.use(express.json());

function authenticate(req, res, next) {

    if (req.headers.authorization) {
        let decode = jwt.verify(req.headers.authorization, 'thisisasecretkey');
        if (decode) {
            req.userId = decode.id;
            next();
        } else {
            res.status(401).json({ message: 'Unauthorized' });
        }
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

app.get("/",(req,res) => {
    res.send("Webserver start running")
});

app.get('/profile/:id', async (req, res) => {
    try {

        let connection = await mongoClient.connect(URL);


        let db = connection.db('zenclass');


        let student = await db
            .collection('student')
            .find({ createdBy: req.userId })
            .toArray();


        await connection.close();

        res.json(student);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

app.get('/dashboard/:id', authenticate, async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL);

        let db = connection.db('zenclass');

        let student = await db
            .collection('student')
            .findOne({ _id: mongodb.ObjectId(req.params.id) });

        await connection.close();

        res.json(student);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }

});

app.get('/dashboard', async (req, res) => {

    try {

        let connection = await mongoClient.connect(URL);

        let db = connection.db('zenclass');

        let students = await db
            .collection('student')
            .find({ _id : req._id })
            .toArray();

        await connection.close();

        res.json(students);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});

app.put('/profile/:id', authenticate, async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL);

        let db = connection.db('zenclass');

        await db
            .collection('student')
            .updateOne({ _id: mongodb.ObjectId(req.params.id) }, { $set: req.body });

        await connection.close();

        res.json({ message: 'Student Updated' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});

app.post('/register', async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL);
        let db = (await connection).db('zenclass');

        let salt = bcrypt.genSaltSync(10);
        var hash = bcrypt.hashSync(req.body.password, salt);
        req.body.password = hash;
        
        
           await db.collection('student').insertOne(req.body);
           let current = await db.collection('student').findOne({email: req.body.email})
           await connection.close();
            res.json({ message: 'User Created' , current })
       

    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});



app.post('/login', async (req, res) => {
    try {

        let connection = await mongoClient.connect(URL);

        let db = connection.db('zenclass');

        let user = await db.collection('student').findOne({ email: req.body.email });
        if (user) {

            let compare = bcrypt.compareSync(req.body.password, user.password);
            if (compare) {

                let token = jwt.sign(
                    { name: user.name, id: user._id },
                    'thisisasecretkey',
                    { expiresIn: '1h' }
                );
                res.json({ token , user});
                
            } else {
                res.status(500).json({ message: 'Credientials does not match' });
            }
        } else {
            res.status(401).json({ message: 'Credientials does not match' });
        }

        await connection.close();

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
});


app.listen(port, () => {
    console.log(`webserver started on port ${port}`)
})