const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config()
const db = require('./config/db.js');

const cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));

const post_art = require('./config/routes');
app.use('/',post_art);

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
}

