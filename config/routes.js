const express = require('express');
const router = express.Router();
const db = require('../config/db');

const apis = require('../controllers/apis');
const middleware = require('../config/middleware');

router.get('/', middleware.checkAdminToken,async(req, res) => {
    //res.send('Welcome!');
    let resp = {};
    let users = await db.get().collection("users").find().sort({ createdAt: -1 }).toArray();

    let images = await db.get().collection("images").find().sort({ createdAt: -1 }).toArray();


    resp["success"] = 200;
    resp["users"] = users;
    resp["images"] = images;
    return res.render('index', { resp: resp });
});
router.get('/addimage', middleware.checkAdminToken, async (req, res) => {
    //res.send('Welcome!');
    let cat = await db.get().collection("category").find().toArray();
    res.render('forms', {cat : cat});
});
router.get('/addcat', middleware.checkAdminToken,(req, res) => {
    //res.send('Welcome!');
    res.render('cat');
});
router.get('/login',(req, res) => {
    //res.send('Welcome!');
    res.render('login', { resp : {success : 200}});
});
router.get('/users',middleware.checkAdminToken,async(req, res) => {
    let resp = {};
    let users = await db.get().collection("users").find().sort({ createdAt: -1 }).toArray();

    //let images = await db.get().collection("images").find().sort({ createdAt: -1 }).toArray();


    resp["success"] = 200;
    resp["users"] = users;
    //resp["images"] = images;
    return res.render('users', { resp: resp });
});

router.get('/images',middleware.checkAdminToken,async(req, res) => {
    let resp = {};
    db.get().collection("images").find().sort({createdAt : -1}).toArray().then(result => {
        resp["success"] = 200;
        resp["images"] = result;

        return res.render('images', { resp : resp})
    }).catch(err => {
        console.log("error....", err);
        resp["success"] = 500;
        resp["message"] = "Something went wrong.";

        return res.status(200).json(resp);

    });
});

router.get('/edit/:id', middleware.checkAdminToken, async (req, res) => {
    //res.send('Welcome!');
    let resp = {};
    let image = await db.get().collection("images").findOne({_id : ObjectID(req.params.id).valueOf()});

    let cat = await db.get().collection("category").find().toArray();

    resp["image"] = image;
    resp["cat"]   = cat;

    res.render('edit', {image : resp});
});

router.get('/cat',middleware.checkAdminToken,async(req, res) => {
    let resp = {};
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
});

router.post('/register',apis.register);
router.post('/login',apis.login);
router.put('/edit',middleware.checkToken,apis.register);
router.post('/check_code',middleware.checkToken,apis.check_cupanCode);
router.get('/userprofile',middleware.checkToken,apis.UserProfile);
router.post('/addmoney',middleware.checkToken,apis.AddMoney);
router.post('/allimages',middleware.checkToken,apis.getImages);
router.post('/pay',middleware.checkToken,apis.Pay);

const admin = require('../controllers/admin');
const { ObjectID } = require('bson');

router.post('/admin/register',admin.register);
router.post('/admin/login',admin.login);

router.post('/admin/addimage', middleware.checkAdminToken,admin.addImage);
router.post('/admin/editimage/:id', middleware.checkAdminToken,admin.addImage);
router.get('/admin/deleteimg/:id', middleware.checkAdminToken,admin.deleteImage);
router.post('/admin/addcat', middleware.checkAdminToken,admin.addCat);
router.get('/admin/getall/:type', middleware.checkAdminToken,admin.getAll);



module.exports = router;