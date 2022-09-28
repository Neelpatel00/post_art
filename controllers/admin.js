let jwToken = require('jsonwebtoken');
const db = require('../config/db');
const { Validator } = require('node-input-validator');
let ObjectID = require('mongodb').ObjectId;



exports.register = async (req, res) =>{
    let resp = {};

    let phone = req.body.phone ? req.body.phone.trim() : "";
    let admin_name = req.body.a_name ? req.body.a_name.trim() : "";
    let password = req.body.password ? req.body.password.trim() : "";


    const validator = new Validator(req.body, {
        phone: 'required|phoneNumber',
        password: 'required'
    });

    const matched = await validator.check();

    if (!matched) {
        resp["success"] = 100;
        resp["message"] = "There are one or more validation errors.";
        resp["validation"] = validator.errors;
        return res.status(422).json(resp);
    }

    let admin = await db.get().collection('admins').findOne({phone : phone});

    if(admin){
        resp["success"] = 100;
        resp["message"] = "There's already an account linked to this phonenumber.";
        return res.status(200).json(resp);
    }
    else {
        db.get().collection('admins').insertOne({
            admin_name:admin_name,
            password:password,
            phone:phone,
            createdAt:new Date()
        }).then(result => {
            resp["success"] = 200;
            resp["message"] = "Registration Successfull";
            resp["data"] = result;

            return res.status(200).json(resp);
        }).catch(err => {
            console.log("error....", err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            return res.status(200).json(resp);
        });
    }
    

};

exports.login = async (req, res) =>{
    let resp = {};

    //let phone = req.body.phone ? req.body.phone.trim() : "";
    let admin_name = req.body.a_name ? req.body.a_name.trim() : "";
    let password = req.body.password ? req.body.password.trim() : "";


    const validator = new Validator(req.body, {
        password: 'required'
    });

    const matched = await validator.check();

    if (!matched) {
        resp["success"] = 100;
        resp["message"] = "There are one or more validation errors.";
        resp["validation"] = validator.errors;
        return res.status(422).json(resp);
    }

    let admin = await db.get().collection('admins').findOne({admin_name : admin_name, password : password});

    if(admin){
        let token = jwToken.sign({ _id: admin._id, phone: admin.phone }, process.env.JWT_SECRET, { expiresIn: '365d' });

        db.get().collection('admins').findOneAndUpdate(
            { _id: admin._id},
            {
                $set:{
                    jwt_token:token,
                    last_login_at:new Date(),
                    updatedAt: new Date(),
                }
            },
            { returnOriginal: true }
        ).then(async(updated_user) => {

            let users = await db.get().collection("users").find().sort({ createdAt: -1 }).toArray();

            let images = await db.get().collection("images").find().sort({ createdAt: -1 }).toArray();
            

            resp["success"] = 200;
            resp["message"] = "Login Successfull.";
            resp["jwt_token"] = token;
            resp["users"] = users;
            resp["images"] = images;
            res.cookie('jwt',token, {httpOnly : true, maxAge : 60 * 60 * 24 * 30})
            //res.cookie('resp',JSON.stringify(resp), {httpOnly : true, maxAge : 60 * 60 * 24 * 30})
            return res.render('index', { resp: resp });
            
        }).catch(err => {
            console.log("error....",err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            return res.render('login', { resp: resp });

        });
    }
    else {
        resp["success"] = 400;
        resp["message"] = "Admin can not be found.";

        return res.render('login', { resp: resp });
    }
    

};


exports.addImage = async (req, res) => {
    let resp = {};

    let image = {};

    if(req.body.fst_name){
        image["festival_name"] = req.body.fst_name ? req.body.fst_name.trim() : "";
    }
    if(req.body.image_url){
        image["image_url"] = req.body.image_url ? req.body.image_url.trim() : "";
    }
    if(req.body.text_color){
        image["text_color"] = req.body.text_color ? req.body.text_color.trim() : "";
    }
    if(req.body.reso){
        image["resolution"] = req.body.reso ? req.body.reso.trim() : "";
    }
    if(req.body.cat_id){
        image["cat_id"] = req.body.cat_id ? req.body.cat_id.trim() : "";
    }
    if(req.body.image_visibility){
        image["image_visibility"] = req.body.image_visibility ? req.body.image_visibility.trim() : "";
    }
    if(req.body.amount){
        image["amount"] = req.body.amount ? req.body.amount.trim() : "";
    }
    if(req.body.frames){
        image["default_frames"] = req.body.frames ? req.body.frames.trim() : "";
    }
    if(req.body.year){
        image["year"] = req.body.year ? req.body.year.trim() : "";
    }
    if(req.body.image_date){
        image["image_date"] = req.body.image_date ? req.body.image_date.trim() : "";
    }
    image["createdAt"] = new Date();
    db.get().collection("images").insertOne(image).then(result => {

        resp["success"] = 200;
        resp["message"] = "Image successfully added.";
        return res.redirect('/admin/getall/image');
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.redirect('/');

    });
}

exports.addCat = async(req, res) => {
    let resp = {}

    let cat = {};

    if(req.body.cat_name){
        cat["cat_name"] = req.body.cat_name ? req.body.cat_name.trim() : "";
    }
    if(req.body.image_url){
        cat["image_url"] = req.body.image_url ? req.body.image_url.trim() : "";
    }
    if(req.body.visibility){
        cat["visibility"] = req.body.visibility ? req.body.visibility.trim() : "";
    }

    cat["createdAt"] = new Date();
    db.get().collection("category").insertOne(cat).then(result => {

        resp["success"] = 200;
        resp["message"] = "Category successfully added.";

        return res.redirect('/admin/getall/cat');

        //return res.status(200).json(resp);
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.redirect('/');

    });



}

exports.getAll = async(req, res) => {
    let resp = {};

    if(req.params.type == "image"){
        db.get().collection("images").find().toArray().then(result => {
            resp["success"] = 200;
            resp["images"] = result;

            return res.render('images', { resp : resp})
        }).catch(err => {
            console.log("error....", err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";
    
            return res.status(200).json(resp);
    
        });
    }
    else{
        db.get().collection("category").find().toArray().then(result => {
            resp["success"] = 200;
            resp["cat"] = result;

            return res.render('allcat', { resp : resp})
        }).catch(err => {
            console.log("error....", err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";
    
            return res.status(200).json(resp);
    
        });
    }
}