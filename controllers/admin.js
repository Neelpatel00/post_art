let jwToken = require('jsonwebtoken');
const db = require('../config/db');
const { Validator } = require('node-input-validator');
let ObjectID = require('mongodb').ObjectId;
const path = require('path');
const fs = require('fs');


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
    console.log("req.body : ",req.body);
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

            // let users = await db.get().collection("users").find().sort({ createdAt: -1 }).toArray();

            // let images = await db.get().collection("images").find().sort({ createdAt: -1 }).toArray();
            

            resp["success"] = 200;
            resp["message"] = "Login Successfull.";
            resp["jwt_token"] = token;
            // resp["users"] = users;
            // resp["images"] = images;
            res.cookie('jwt',token, {httpOnly : true, maxAge : 60 * 60 * 24 * 300})
            //res.cookie('resp',JSON.stringify(resp), {httpOnly : true, maxAge : 60 * 60 * 24 * 30})
            return res.redirect('/');
            //return res.status(200).json(resp);
            
        }).catch(err => {
            console.log("error....",err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            return res.render('login', { resp: resp });
            //return res.status(200).json(resp);
            

        });
    }
    else {
        resp["success"] = 400;
        resp["message"] = "Admin can not be found.";

        return res.render('login', { resp: resp });
        //return res.status(200).json(resp);
            
    }
    

};


exports.addImage = async (req, res) => {
    let resp = {};

    let image = {};

    //console.log("req.body : ",req.body)

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
        image["cat_id"] = ObjectID(req.body.cat_id.trim()).valueOf();
    }
    if(req.body.subcat_id){
        image["subcat_id"] = ObjectID(req.body.subcat_id.trim()).valueOf();
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
        image["image_date"] = req.body.image_date ? new Date(req.body.image_date.trim()) : "";
    }

    if (req.params.id == undefined) {
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
    else{
        image["updatedAt"] = new Date();
        db.get().collection("images").findOneAndUpdate(
            { _id: ObjectID(req.params.id).valueOf()},
            {
                $set:image
            },
            { returnOriginal: true }

        ).then(result => {

            resp["success"] = 200;
            resp["message"] = "Image successfully updated.";
            return res.redirect('/admin/getall/image');
        }).catch(err => {
            console.log("error....", err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            return res.redirect('/');

        });
    }
    
};

exports.deleteImage = async (req, res) => {
    let resp = {};

    db.get().collection("images").deleteOne(
        { _id: ObjectID(req.params.id).valueOf()},
    ).then(result => {

        resp["success"] = 200;
        resp["message"] = "Image successfully deleted.";
        return res.redirect('/admin/getall/image');
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.redirect('/');

    });
    
}

exports.addCat = async (req, res) => {
    let resp = {}

    let cat = {};

    if (req.body.cat_name) {
        cat["cat_name"] = req.body.cat_name ? req.body.cat_name.trim() : "";
    }
    if (req.body.image_url) {
        cat["image_url"] = req.body.image_url ? req.body.image_url.trim() : "";
    }
    if (req.body.visibility) {
        cat["visibility"] = req.body.visibility ? req.body.visibility.trim() : "";
    }
    if (req.body.cat_id) {
        cat["parent_category_id"] = ObjectID(req.body.cat_id).valueOf();
    }
    else{
        cat["parent_category_id"] = null;
    }
    if(req.body.date){
        cat["date"] = req.body.date ? new Date(req.body.date.trim()) : "";
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

exports.editCat = async (req, res) => {
    let resp = {}

    let cat = {};

    if (req.body.cat_name) {
        cat["cat_name"] = req.body.cat_name ? req.body.cat_name.trim() : "";
    }
    if (req.body.image_url) {
        cat["image_url"] = req.body.image_url ? req.body.image_url.trim() : "";
    }
    if (req.body.visibility) {
        cat["visibility"] = req.body.visibility ? req.body.visibility.trim() : "";
    }
    if (req.body.cat_id) {
        cat["parent_category_id"] = ObjectID(req.body.cat_id).valueOf();
    }
    else{
        cat["parent_category_id"] = null;
    }
    if(req.body.date){
        cat["date"] = req.body.date ? new Date(req.body.date.trim()) : "";
    }


    cat["updatedAt"] = new Date();
    db.get().collection("category").updateOne(
        { _id: ObjectID(req.params.id).valueOf() },
        { $set: cat }
    ).then(result => {

        resp["success"] = 200;
        resp["message"] = "Category successfully updated.";

        return res.redirect('/admin/getall/cat');

        //return res.status(200).json(resp);
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.redirect('/');

    });






}

exports.subCat = async (req, res) => {
    let resp = {}

    db.get().collection("category").aggregate([
        {
            $match :{_id:ObjectID(req.params.id).valueOf(),parent_category_id:null}
        },
        { $lookup:
            {
              from: 'category',
              localField: '_id',
              foreignField: 'parent_category_id',
              as: 'sub_cat',
            }               
          },
    ]).toArray().then(cat => {

        resp["success"] = 200;
        resp["cat"] = cat;
        resp["message"] = "Category successfully updated.";

        //return res.status(200).json(resp);
        return res.render('allsubcat',{cat : cat});

    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.redirect('/');

    });

}

exports.editAllImg = async (req, res) => {
    let resp = {}

    let img = {};

    if (req.body.new_v) {
        img["image_visibility"] = req.body.new_v ? req.body.new_v.trim() : "";
    }

    img["updatedAt"] = new Date();
    db.get().collection("images").updateMany(
        { image_visibility :  req.body.old_v.trim()},
        { $set: img }
    ).then(result => {

        resp["success"] = 200;
        resp["message"] = "Images successfully updated.";

        return res.redirect('/admin/getall/image');

        //return res.status(200).json(resp);
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.redirect('/');

    });






}

exports.deleteCat = async (req, res) => {
    let resp = {};

    db.get().collection("category").deleteOne(
        { _id: ObjectID(req.params.id).valueOf()},
    ).then(result => {

        resp["success"] = 200;
        resp["message"] = "category successfully deleted.";
        return res.redirect('/admin/getall/cat');
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
        console.log("pageno : ",req.params.pageno)
        if(req.params.pageno != undefined){
            return res.redirect(`/images/${req.params.pageno}`);
        }
        else{
            return res.redirect(`/images/${1}`);
        }
        
    }
    else{
        return res.redirect('/cat');
    }
}


exports.importCsv = async(req, res) => {
    let resp = {}
    console.log("hello");
    try {
        let arr = [];
        console.log("req.file : ",req.file);
        const csvFilePath = req.file.path;
        const csv = require('csvtojson')
        csv()
            .fromFile(csvFilePath)
            .then(async (data) => {
                console.log("data.length : ",data.length);
                for (let i = 0; i < data.length; i++) {
                    let image = {};
                    if (data[i]["festival_name"] == "" && data[i]["image_url"] == "" && data[i]["cat_name"] == "") {
                        continue;
                    }

                    image["festival_name"] = data[i]["festival_name"] ? data[i]["festival_name"].trim() : "";

                    image["image_url"] = data[i]["image_url"] ? data[i]["image_url"].trim() : "";
                    image["text_color"] = data[i]["text_color"] ? data[i]["text_color"].trim() : "";
                    image["resolution"] = data[i]["resolution"] ? data[i]["resolution"].trim() : "";
                    image["image_visibility"] = data[i]["image_visibility"] ? data[i]["image_visibility"].trim() : "";
                    image["amount"] = data[i]["amount"] ? data[i]["amount"].trim() : "";
                    image["default_frames"] = data[i]["default_frames"] ? data[i]["default_frames"].trim() : "";
                    image["year"] = data[i]["year"] ? data[i]["year"].trim() : "";
                    image["image_date"] = data[i]["image_date"] ? new Date(data[i]["image_date"].trim()) : "";

                    if (data[i]["cat_name"] != "") {
                        let cat = await db.get().collection("category").findOne({ cat_name: data[i]["cat_name"].trim() });
                        if (cat) {
                            image["cat_id"] = ObjectID(cat._id).valueOf();
                        }
                    }
                    if (data[i]["subcat_name"] != "") {
                        let cat = await db.get().collection("category").findOne({ cat_name: data[i]["subcat_name"].trim() });
                        if (cat) {
                            image["subcat_id"] = ObjectID(cat._id).valueOf();
                        }
                    }
                    image["createdAt"] = new Date();
                    db.get().collection("images").insertOne(image);

                    arr.push(image);
                }

                fs.unlinkSync(req.file.path);
                resp["success"] = 200;
                resp["message"] = "successfull.";
                resp["images"] = arr;

                return res.redirect('/admin/getall/image');

            })
            .catch(err => {
                console.log("error....", err);
                resp["success"] = 500;
                resp["message"] = "Something went wrong.";

                return res.redirect('/');

            });


    }
    catch (err) {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.redirect('/');
    }

}

exports.reactLogin = async (req, res) =>{
    let resp = {};
    console.log("req.body : ",req.body);
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

            // let users = await db.get().collection("users").find().sort({ createdAt: -1 }).toArray();

            // let images = await db.get().collection("images").find().sort({ createdAt: -1 }).toArray();
            

            resp["success"] = 200;
            resp["message"] = "Login Successfull.";
            resp["jwt_token"] = token;
            // resp["users"] = users;
            // resp["images"] = images;
            res.cookie('jwt',token, {httpOnly : true, maxAge : 60 * 60 * 24 * 300})
            //res.cookie('resp',JSON.stringify(resp), {httpOnly : true, maxAge : 60 * 60 * 24 * 30})
            //return res.redirect('/');
            return res.status(200).json(resp);
            
        }).catch(err => {
            console.log("error....",err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            //return res.render('login', { resp: resp });
            return res.status(200).json(resp);
            

        });
    }
    else {
        resp["success"] = 400;
        resp["message"] = "Admin can not be found.";

        //return res.render('login', { resp: resp });
        return res.status(200).json(resp);
            
    }
    

};

exports.reactImages = async(req, res) => {
    let resp = {}; 

    db.get().collection("images").find({}).sort({createdAt : -1})
    .toArray().then(result => {
        resp["success"] = 200;
        resp["images"] = result;


        return res.status(200).json(resp);
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.status(200).json(resp);

    });
}

exports.reactUsers = async(req, res) => {
    let resp = {};
    let users = await db.get().collection("users").find().sort({ createdAt: -1 }).toArray();

    //let images = await db.get().collection("images").find().sort({ createdAt: -1 }).toArray();

    //console.log("users : ",users[0])
    resp["success"] = 200;
    resp["users"] = users;
    //resp["images"] = images;
    return res.status(200).json(resp);
}


exports.reactAddImage = async (req, res) => {
    let resp = {};

    let image = {};

    console.log("req.body : ",req.body)

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
        image["cat_id"] = ObjectID(req.body.cat_id.trim()).valueOf();
    }
    if(req.body.subcat_id){
        image["subcat_id"] = ObjectID(req.body.subcat_id.trim()).valueOf();
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
        image["image_date"] = req.body.image_date ? new Date(req.body.image_date.trim()) : "";
    }
    if(req.body.isBackground){
        image["isBackground"] = req.body.isBackground ? req.body.isBackground.trim() : "0";
    }

    if (req.params.id == undefined) {
        image["createdAt"] = new Date();
        db.get().collection("images").insertOne(image).then(result => {

            resp["success"] = 200;
            resp["message"] = "Image successfully added.";
            return res.status(200).json(resp);
        }).catch(err => {
            console.log("error....", err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            return res.status(200).json(resp);

        });
    }
    else{
        image["updatedAt"] = new Date();
        db.get().collection("images").findOneAndUpdate(
            { _id: ObjectID(req.params.id).valueOf()},
            {
                $set:image
            },
            { returnOriginal: true }

        ).then(result => {
            resp["success"] = 200;
            resp["message"] = "Image successfully updated.";
            return res.status(200).json(resp);
        }).catch(err => {
            console.log("error....", err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            return res.status(200).json(resp);

        });
    }
    
};


exports.reactDeleteImage = async (req, res) => {
    let resp = {};

    db.get().collection("images").deleteOne(
        { _id: ObjectID(req.params.id).valueOf()},
    ).then(result => {
        console.log("result : ",result);
        resp["success"] = 200;
        resp["message"] = "Image successfully deleted.";
        return res.status(200).json(resp);
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.status(200).json(resp);

    });
    
}

exports.reactCat = async (req, res) => {
    let resp = {};
    db.get().collection("category").find({parent_category_id : null}).toArray().then(async result => {

        let sub_cat = await db.get().collection("category").find({parent_category_id : {$ne: null}}).toArray();

        resp["success"] = 200;
        resp["cat"] = result;
        resp["sub_cat"] = sub_cat;

        return res.status(200).json(resp);
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.status(200).json(resp);

    });
}


exports.reactSubCat = async (req, res) => {
    let resp = {};
    let query = {};
    if(req.params.id){
        console.log("id : ",req.params.id)
        let cat_id = ObjectID(req.params.id).valueOf();
        query = {parent_category_id : cat_id};
    }
    else{
        query = {parent_category_id : {$ne : null}}
    }
    
    db.get().collection("category").find(query).toArray().then(result => {

        resp["success"] = 200;
        resp["cat"] = result;

        return res.status(200).json(resp);
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.status(200).json(resp);

    });
}

exports.reatAddCat = async (req, res) => {
    let resp = {}

    let cat = {};

    if (req.body.cat_name) {
        cat["cat_name"] = req.body.cat_name ? req.body.cat_name.trim() : "";
    }
    if (req.body.image_url) {
        cat["image_url"] = req.body.image_url ? req.body.image_url.trim() : "";
    }
    if (req.body.visibility) {
        cat["visibility"] = req.body.visibility ? req.body.visibility.trim() : "";
    }
    if (req.body.cat_id) {
        cat["parent_category_id"] = ObjectID(req.body.cat_id).valueOf();
    }
    else{
        cat["parent_category_id"] = null;
    }
    if(req.body.date){
        cat["date"] = req.body.date ? new Date(req.body.date.trim()) : "";
    }

    if (req.method == 'POST') {
        cat["createdAt"] = new Date();
        db.get().collection("category").insertOne(cat).then(result => {

            resp["success"] = 200;
            resp["message"] = "Category successfully added.";

            return res.status(200).json(resp);

            //return res.status(200).json(resp);
        }).catch(err => {
            console.log("error....", err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            return res.status(200).json(resp);

        });

    }
    else {
        cat["updatedAt"] = new Date();
        db.get().collection("category").updateOne(
            { _id: ObjectID(req.params.id).valueOf() },
            { $set: cat }
        ).then(result => {

            resp["success"] = 200;
            resp["message"] = "Category successfully updated.";

            return res.status(200).json(resp);

            //return res.status(200).json(resp);
        }).catch(err => {
            console.log("error....", err);
            resp["success"] = 500;
            resp["message"] = "Something went wrong.";

            return res.status(200).json(resp);

        });
    }
}


exports.reactDeleteCat = async (req, res) => {
    let resp = {};

    db.get().collection("category").deleteOne(
        { _id: ObjectID(req.params.id).valueOf()},
    ).then(result => {

        resp["success"] = 200;
        resp["message"] = "category successfully deleted.";
        return res.status(200).json(resp);
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.status(200).json(resp);

    });
    
}

exports.react_ImportCsv = async(req, res) => {
    let resp = {}
    try {
        let arr = [];
        console.log("req.file : ",req.file);
        const csvFilePath = req.file.path;
        const csv = require('csvtojson')
        csv()
            .fromFile(csvFilePath)
            .then(async (data) => {
                console.log("data.length : ",data.length);
                for (let i = 0; i < data.length; i++) {
                    let image = {};
                    if (data[i]["festival_name"] == "" && data[i]["image_url"] == "" && data[i]["cat_name"] == "") {
                        continue;
                    }

                    image["festival_name"] = data[i]["festival_name"] ? data[i]["festival_name"].trim() : "";

                    image["image_url"] = data[i]["image_url"] ? data[i]["image_url"].trim() : "";
                    image["text_color"] = data[i]["text_color"] ? data[i]["text_color"].trim() : "";
                    image["resolution"] = data[i]["resolution"] ? data[i]["resolution"].trim() : "";
                    image["image_visibility"] = data[i]["image_visibility"] ? data[i]["image_visibility"].trim() : "";
                    image["amount"] = data[i]["amount"] ? data[i]["amount"].trim() : "";
                    image["default_frames"] = data[i]["default_frames"] ? data[i]["default_frames"].trim() : "";
                    image["year"] = data[i]["year"] ? data[i]["year"].trim() : "";
                    image["image_date"] = data[i]["image_date"] ? new Date(data[i]["image_date"].trim()) : "";
                    image["isBackground"] = data[i]["isBackground"] ? data[i]["isBackground"].trim() : "0";

                    if (data[i]["cat_name"] != "") {
                        let cat = await db.get().collection("category").findOne({ cat_name: data[i]["cat_name"].trim() });
                        if (cat) {
                            image["cat_id"] = ObjectID(cat._id).valueOf();
                        }
                    }
                    if (data[i]["subcat_name"] != "" && data[i]["subcat_name"] != undefined) {
                        console.log("data[i] : ",data[i]["subcat_name"]);
                        let cat = await db.get().collection("category").findOne({ cat_name: data[i]["subcat_name"].trim() });
                        if (cat) {
                            image["subcat_id"] = ObjectID(cat._id).valueOf();
                        }
                        else{
                            image["subcat_id"] = null;
                        }
                    }
                    else{
                        image["subcat_id"] = null;
                    }
                    image["createdAt"] = new Date();
                    db.get().collection("images").insertOne(image);
                    //console.log("image : ",image);
                    arr.push(image);
                }

                fs.unlinkSync(req.file.path);
                resp["success"] = 200;
                resp["message"] = "File Successfully Uploaded.";
                resp["images"] = arr;

                return res.status(200).json(resp);

            })
            .catch(err => {
                console.log("error....", err);
                resp["success"] = 500;
                resp["message"] = "Something went wrong.";

                return res.status(200).json(resp);

            });


    }
    catch (err) {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.status(200).json(resp);
    }

}

exports.reactHomeData = async(req, res) => {
    let resp = {};
    let users = await db.get().collection("users").find().sort({ updatedAt: -1 }).toArray();

    let images = await db.get().collection("images").find().sort({ createdAt: -1 }).toArray();

    //console.log("users : ",users[0])
    resp["success"] = 200;
    resp["users"] = users.length;
    resp["images"] = images.length;
    resp["last_user"] = users[0];
    return res.status(200).json(resp);
}

exports.sendNotification = async (req, res) => {

    let resp = {};
    const firebase_admin = require("firebase-admin");
    console.log("req.body : ",req.body);
    //let fcm_token = "e5EeNI9gT7yfbl0xIM4ipl:APA91bHT4c46PplfK2OJKz-h8NiK3MKbspNF8DX2BhSrpk5q65BKd97cfBPij3P7n4Z9ziegg9ABh8fOM78zpwKgOwol6MTGnDSgk0fZ19SoDjw0xHio9g8Su3e8dFw8igKM4B1KvNUi"//req.body.fcm_token ? req.body.fcm_token.trim() : "";

    let title = req.body.title ? req.body.title : "PostArtistry";
    let msg = req.body.msg ? req.body.msg : 'Wlecome to PostArtistry World!';
    let img_url = req.body.img_url ? req.body.img_url : 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYiVAH6OnX_wjJazcH9HDGWvIEI4acoV4-cw&usqp=CAU';

    let type = req.body.type ? req.body.type : "5";
    let cat_id = req.body.cat_id ? req.body.cat_id : "";
    let subcat_id = req.body.subcat_id ? req.body.subcat_id : "";

    let fcm_tokens = [];

    if(req.body.fcm_token){
        fcm_tokens.push(req.body.fcm_token.trim());
    }
    else{
        let users = await db.get().collection("users").find().sort({ createdAt: -1 }).toArray();

        for(let i=0; i< users.length; i++){
            if(users[i].fcm_token != "" && users[i].fcm_token != null){
                fcm_tokens.push(users[i].fcm_token.trim());
            }
        }
    }
    
    if(fcm_tokens.length > 0){
        let payload = {
            // notification: {
            //     title: title,
            //     body: msg,
            //     image:img_url
            //   },
              //data: { link_type: 'nolink', display_for: 'member' }
            data: {
                title: title,
                body: msg,
                "attachment-url": img_url,
                type:type,
                cat_id:cat_id,
                subcat_id:subcat_id,
            },

          };
          let options = {
            mutableContent : true
         }
          firebase_admin.messaging().sendToDevice(fcm_tokens, payload,options)
            .then(response => {
            //   console.log('ress:', response);
            //   console.log('payload : ', payload);
            console.log('successCount :', response.successCount);
            console.log('failureCount :', response.failureCount);
              resp["error"] = 0;
              resp["message"] = 'successfull';
              resp["result"] = response;

              res.status(200).json(resp);

            })
            .catch(error => {
                console.log('error:', error);
                resp["error"] = 1;
                resp["message"] = 'Something went wrong';
                res.status(200).json(resp);
            });
    }
    else {
        resp["error"] = 1;
        resp["message"] = 'Something went wrong';
        res.status(200).json(resp);
    }

};