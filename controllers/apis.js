let jwToken = require('jsonwebtoken');
const db = require('../config/db');
const { Validator } = require('node-input-validator');


exports.login = async (req, res) =>{
    var voucher_codes = require('voucher-code-generator');
    let resp = {};

    let full_name = req.body.full_name ? req.body.full_name.trim() : "";
    let business_name = req.body.business_name ? req.body.business_name.trim() : "";
    let email = req.body.email ? req.body.email.trim() : "";
    let phone = req.body.phone ? req.body.phone.trim() : "";
    let fcm_token = req.body.fcm_token ? req.body.fcm_token.trim() : "";
    let wallet = req.body.wallet ? req.body.wallet.trim() : "";


    const validator = new Validator(req.body, {
        phone: 'required|phoneNumber'
    });

    const matched = await validator.check();

    if (!matched) {
        resp["error"] = 2;
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
                    updatedAt: new Date(),
                }
            },
            { returnOriginal: true }
        ).then((updated_user) => {
            resp["error"] = 0;
            resp["message"] = "Login Successfull";
            resp["jwt_token"] = token;
            resp["user"] = updated_user.value;

            return res.status(200).json(resp);
        }).catch(err => {
            console.log("error....",err);
            resp["error"] = 1;
            resp["message"] = "Something went wrong.";

            return res.status(200).json(resp);

        });
    }
    else {
        let c_code = voucher_codes.generate({
            length: 8,
            count: 1
        });
        console.log("cupan_code....", c_code);


        let user = await db.get().collection('users').insertOne({
            full_name: full_name,
            business_name: business_name,
            email: email,
            phone: phone,
            fcm_token: fcm_token,
            cupan_code: c_code[0],
            wallet: wallet,
            status: "active",
            createdAt: new Date(),
            last_login_at: new Date()
        });
        if (user) {
            console.log("user : ", user);
            let token = jwToken.sign({ _id: user.insertedId , phone: phone }, process.env.JWT_SECRET, { expiresIn: '365d' });

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
                    resp["error"] = 0;
                    resp["message"] = "Login Successfull";
                    resp["jwt_token"] = token;
                    resp["user"] = updated_user.value;

                    return res.status(200).json(resp);
                })
                .catch(err => {
                    console.log("error....", err);
                    resp["error"] = 1;
                    resp["message"] = "Something went wrong.";

                    return res.status(200).json(resp);

                });
        }
        

    }
    

}