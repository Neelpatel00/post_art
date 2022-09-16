let jwToken = require('jsonwebtoken');
const db = require('../config/db');
const { Validator } = require('node-input-validator');
let ObjectID = require('mongodb').ObjectId;


exports.register = async (req, res) => {
    var voucher_codes = require('voucher-code-generator');
    let resp = {};
    let users = {};

    if (req.body.full_name) {
        users["full_name"] = req.body.full_name.trim()
    }
    if (req.body.business_name) {
        users["business_name"] = req.body.business_name.trim()
    }
    if (req.body.email) {
        users["email"] = req.body.email.trim()
    }
    if (req.body.phone) {
        users["phone"] = req.body.phone.trim()
    }
    if (req.body.address) {
        users["address"] = req.body.address.trim()
    }
    if (req.body.website) {
        users["website"] = req.body.website.trim()
    }
    if (req.body.facebook) {
        users["facebook"] = req.body.facebook.trim()
    }
    if (req.body.instagram) {
        users["instagram"] = req.body.instagram.trim()
    }
    if (req.body.youtube) {
        users["youtube"] = req.body.youtube.trim()
    }
    if (req.body.fcm_token) {
        users["fcm_token"] = req.body.fcm_token.trim()
    }
    if (req.body.device_id) {
        users["device_id"] = req.body.device_id.trim()
    }

    let phone = req.body.phone ? req.body.phone.trim() : "";

    const validator = new Validator(req.body, {
        phone: 'required|phoneNumber'
    });

    const matched = await validator.check();

    if (req.method == "POST") {

        if (!matched) {
            resp["success"] = 100;
            resp["message"] = "There are one or more validation errors.";
            resp["validation"] = validator.errors;
            return res.status(422).json(resp);
        }

        let c_code = voucher_codes.generate({
            length: 8,
            count: 1
        });
        console.log("cupan_code....", c_code);

        users["cupan_code"] = c_code[0].toUpperCase();
        users["wallet"] = "";
        users["last_login_at"] = new Date();
        users["createdAt"] = new Date();

        let chk_user = await db.get().collection('users').findOne({phone : phone});

        if (chk_user) {
            resp["success"] = 100;
            resp["message"] = "There's already an account linked to this phonenumber.";
            return res.status(200).json(resp);
        }
        else {
            let user = await db.get().collection('users').insertOne(users);
            if (user) {
                console.log("user : ", user);
                let token = jwToken.sign({ _id: user.insertedId, phone: phone }, process.env.JWT_SECRET, { expiresIn: '365d' });

                db.get().collection('users').findOneAndUpdate(
                    { _id: user.insertedId },
                    {
                        $set: {
                            jwt_token: token,
                            updatedAt: new Date(),
                        }
                    },
                    { returnOriginal: false }
                )
                    .then((updated_user) => {
                        resp["success"] = 200;
                        resp["message"] = "Registration Successfull";
                        resp["jwt_token"] = token;
                        updated_user.value.jwt_token = token;
                        resp["data"] = updated_user.value;

                        return res.status(200).json(resp);
                    })
                    .catch(err => {
                        console.log("error....", err);
                        resp["success"] = 500;
                        resp["message"] = "Something went wrong.";

                        return res.status(200).json(resp);

                    });
            }
        }
    }
    else{

        users["updatedAt"] = new Date();

        db.get().collection('users').findOneAndUpdate(
            { phone: req.decoded.phone },
            {
                $set:users
            },
            { returnOriginal: false }
        )
            .then(async(updated_user) => {

                let user = await db.get().collection('users').findOne({phone : req.decoded.phone});
                resp["success"] = 200;
                resp["message"] = "Update Successfull.";
                resp["data"] = user;

                return res.status(200).json(resp);
            })
            .catch(err => {
                console.log("error....", err);
                resp["success"] = 500;
                resp["message"] = "Something went wrong.";

                return res.status(200).json(resp);

            });

    }

    


};

exports.login = async (req, res) =>{
    let resp = {};

    let phone = req.body.phone ? req.body.phone.trim() : "";
    let fcm_token = req.body.fcm_token ? req.body.fcm_token.trim() : "";
    let device_id = req.body.device_id ?  req.body.device_id.trim() : "";


    const validator = new Validator(req.body, {
        phone: 'required|phoneNumber'
    });

    const matched = await validator.check();

    if (!matched) {
        resp["success"] = 100;
        resp["message"] = "There are one or more validation errors.";
        resp["validation"] = validator.errors;
        return res.status(422).json(resp);
    }

    let user = await db.get().collection('users').findOne({phone : phone});

    if(user){
        let token = jwToken.sign({ _id: user._id, phone: phone }, process.env.JWT_SECRET, { expiresIn: '365d' });

        db.get().collection('users').findOneAndUpdate(
            { _id: user._id},
            {
                $set:{
                    jwt_token:token,
                    fcm_token:fcm_token,
                    device_id:device_id,
                    last_login_at:new Date(),
                    updatedAt: new Date(),
                }
            },
            { returnOriginal: true }
        ).then((updated_user) => {
            resp["success"] = 200;
            resp["message"] = "Login Successfull.";
            resp["jwt_token"] = token;
            updated_user.value.jwt_token = token;
            updated_user.value.fcm_token = fcm_token;
            updated_user.value.device_id = device_id;
            resp["data"] = updated_user.value;

            return res.status(200).json(resp);
        }).catch(err => {
            console.log("error....",err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            return res.status(200).json(resp);

        });
    }
    else {
        resp["success"] = 400;
        resp["message"] = "User can not be found.";

        return res.status(200).json(resp);
    }
    

};

exports.check_cupanCode = async (req, res) => {
    let resp = {};
    let cupan_code = req.body.cupan_code ? req.body.cupan_code.trim() : ""

    console.log("cupan_code...",req.userData.cupan_code);
    if(cupan_code != req.userData.cupan_code){
        let f_user = await db.get().collection('users').findOne({cupan_code : cupan_code});

        if(f_user){
            
            let amount = (f_user.wallet != "") ? parseInt(f_user.wallet) + 5 : 5;
            db.get().collection('users').findOneAndUpdate(
                { _id: f_user._id},
                {
                    $set:{
                        wallet:amount,
                        updatedAt: new Date(),
                    }
                },
                { returnOriginal: true }
            );
            
            let amt = (req.userData.wallet != "" && req.userData.wallet != undefined) ? parseInt(req.userData.wallet) + 5 : 5;
            await db.get().collection('users').findOneAndUpdate(
                { phone: req.decoded.phone},
                {
                    $set:{
                        wallet:amt,
                        first_login:1,
                        updatedAt: new Date(),
                    }
                },
                { returnOriginal: true }
            );

            db.get().collection('users').findOne({phone: req.decoded.phone})
            .then((user) => {
                resp["success"] = 200;
                resp["message"] = "success.";
                resp["data"] = user;

                return res.status(200).json(resp);
            })
            .catch(err => {
                console.log("error....",err);
                resp["success"] = 500;
                resp["message"] = "Something went wrong.";
    
                return res.status(200).json(resp);
    
            });

        }
    }
    else{
        resp["success"] = 200;
        resp["message"] = "Please enter valid code.";

        return res.status(200).json(resp);
    }


}