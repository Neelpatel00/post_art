const db = require('./db');
let jwToken = require('jsonwebtoken');
let ObjectID = require('mongodb').ObjectId;


exports.checkToken = async(req, res, next) =>{
    let resp  = {};
    let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
    if (token) {
        if (token.startsWith('Bearer')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }
        jwToken.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                resp["success"] = 401;  //  Missing or Incorrect Token
                resp["message"] = "Token is not valid";
                return res.status(400).json(resp);
            } else {
                let user = db.get().collection('users').findOne({_id  : ObjectID(decoded._id).valueOf()})
                .then(user => {
                    if(user){
                        console.log("decoded....",decoded);
                        req.decoded = decoded;
                        req.userData = user;
                        next();
                    }else{
                        resp["success"] = 400;  //  Missing or Incorrect Token
                        resp["message"] = "User is not active or does not exist.";
                        return res.status(400).json(resp);
                    }
                });
            }
        });
    } else {
        resp["success"] = 400;  //  Missing or Incorrect Token
        resp["message"] = "Auth token is not supplied";
        return res.status(400).json(resp);
    }
};



exports.checkAdminToken = async(req, res, next) =>{
    let resp  = {};
    console.log("req.cookies.....",req.cookies);
    let token = req.cookies.jwt || req.headers['authorization'];;
    if (token) {
        if (token.startsWith('Bearer')) {
            // Remove Bearer from string
            token = token.slice(7, token.length);
        }
        jwToken.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                resp["success"] = 401;  //  Missing or Incorrect Token
                resp["message"] = "Token is not valid";
                return res.status(400).json(resp);
            } else {
                let admin = db.get().collection('admins').findOne({_id  : ObjectID(decoded._id).valueOf()})
                .then(user => {
                    if(user){
                        console.log("decoded....",decoded);
                        req.decoded = decoded;
                        req.userData = user;
                        next();
                    }else{
                        resp["success"] = 400;  //  Missing or Incorrect Token
                        resp["message"] = "Admin is not active or does not exist.";

                        res.render('login', { resp : resp});

                        //return res.status(400).json(resp);
                    }
                });
            }
        });
    } else {
        resp["success"] = 200;  //  Missing or Incorrect Token
        resp["message"] = "Admin is not active or does not exist.";

        res.render('login', { resp : resp});
        //return res.status(400).json(resp);
    }
};
