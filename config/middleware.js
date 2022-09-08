const db = require('./db');
let jwToken = require('jsonwebtoken');
let ObjectID = require('mongodb');


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
                resp["error"] = 3;  //  Missing or Incorrect Token
                resp["message"] = "Token is not valid";
                return res.status(400).json(resp);
            } else {
                let user = db.get().collection('users').findOne({_id  : ObjectID(decoded._id).valueOf()})
                .then(user => {
                    if(user && user.status == "active"){
                        console.log("decoded....",decoded);
                        req.decoded = decoded;
                        req.userData = user;
                        next();
                    }else{
                        resp["error"] = 3;  //  Missing or Incorrect Token
                        resp["message"] = "User is not active or does not exist.";
                        return res.status(400).json(resp);
                    }
                });
            }
        });
    } else {
        resp["error"] = 3;  //  Missing or Incorrect Token
        resp["message"] = "Auth token is not supplied";
        return res.status(400).json(resp);
    }
}

