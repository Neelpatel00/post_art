const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config()
const db = require('./config/db.js');

const cors = require('cors');
var cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public/'));

const post_art = require('./config/routes');
app.use('/',post_art);

const firebase_admin = require("firebase-admin");

firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert({
      projectId: process.env.FireBasePROJECTID,
      clientEmail: process.env.FireBaseClientEmail,
      privateKey: process.env.FireBasePrivateKey
    })
});


let port = process.env.PORT || 2200;




if(process.env.NODE_ENV == 'dev'){
    db.connect(process.env.DB_URL, (err) =>{
        if (err) {
            console.log('Unable to connect to Mongo.');
            console.log('error : ',err);
            process.exit(1)
        }
        else{
            app.listen(port, ()=>{
                console.log("Magic happens on.....",port);
            });
        }
    })
    db.connect2(process.env.DB_URL_2, (err) =>{
        if (err) {
            console.log('Unable to connect to Mongo.');
            console.log('error : ',err);
            process.exit(1)
        }
    });
}

