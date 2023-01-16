const express = require('express');
const router = express.Router();
const db = require('../config/db');

const apis = require('../controllers/apis');
const middleware = require('../config/middleware');

const multer = require('multer');
let maxSize = 11 * 1000 * 1000;
let upload = multer({ dest: 'public/images/uploads' , limits: {fileSize: maxSize}});

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
router.get('/addcat', middleware.checkAdminToken,async(req, res) => {
    //res.send('Welcome!');
    let cat = await db.get().collection("category").find({parent_category_id : null}).toArray();
    res.render('cat',{cat : cat});
});
router.get('/import', middleware.checkAdminToken,(req, res) => {
    //res.send('Welcome!');
    res.render('import');
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

router.get('/images/:pageno?',middleware.checkAdminToken,async(req, res) => {
    let resp = {};
    let pageno = (req.params.pageno && req.params.pageno != 0) ? req.params.pageno : 1;
    let limit = 10;
    let offset = (pageno - 1) * limit;
    console.log("pageno1 : ",req.params.pageno)
    let count = await db.get().collection("images").find().toArray();
    db.get().collection("images").find().sort({createdAt : -1})
    .skip(offset)
    .limit(limit)
    .toArray().then(result => {
        resp["success"] = 200;
        resp["images"] = result;
        resp["current_page"] = pageno;
        resp["pages"] = Math.abs(Math.ceil(count.length / limit));

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

router.get('/catedit/:id', middleware.checkAdminToken, async (req, res) => {
    //res.send('Welcome!');
    let resp = {};
    let one_cat = await db.get().collection("category").findOne({_id : ObjectID(req.params.id).valueOf()});

    let cat = await db.get().collection("category").find({parent_category_id : null}).toArray();

    resp["one_cat"] = one_cat;
    resp["cat"]   = cat;

    res.render('catedit', {cat : resp});
});

router.get('/cat',middleware.checkAdminToken,async(req, res) => {
    let resp = {};
    db.get().collection("category").find({parent_category_id : null}).toArray().then(result => {
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

//version 1
router.post('/register',apis.register);
router.post('/login',apis.login);
router.put('/edit',middleware.checkToken,apis.register);
router.post('/check_code',middleware.checkToken,apis.check_cupanCode);
router.get('/userprofile',middleware.checkToken,apis.UserProfile);
router.post('/addmoney',middleware.checkToken,apis.AddMoney);
router.post('/allimages',middleware.checkToken,apis.getImages);
router.post('/pay',middleware.checkToken,apis.Pay);
router.delete('/deleteuser',middleware.checkToken,apis.deleteUser);
router.get('/logout',middleware.checkToken,apis.Logout);

//version 2
router.post('/v2/register',apis.register);
router.post('/v2/login',apis.login);
router.put('/v2/edit',middleware.checkToken,apis.register);
router.post('/v2/check_code',middleware.checkToken,apis.check_cupanCode);
router.get('/v2/userprofile',middleware.checkToken,apis.UserProfile);
router.post('/v2/addmoney',middleware.checkToken,apis.AddMoney);
router.post('/v2/allimages',middleware.checkToken,apis.getImages);
router.post('/v2/allimages',apis.getImages);
router.post('/v2/pay',middleware.checkToken,apis.Pay);
router.delete('/v2/deleteuser',middleware.checkToken,apis.deleteUser);
router.get('/v2/logout',middleware.checkToken,apis.Logout);

router.post('/v2/home',apis.getHome);
router.post('/v2/images',apis.getImageById);

const admin = require('../controllers/admin');
const { ObjectID } = require('bson');

router.post('/admin/register',admin.register);
router.post('/admin/login',admin.login);

router.post('/admin/addimage', middleware.checkAdminToken,admin.addImage);
router.post('/admin/editimage/:id', middleware.checkAdminToken,admin.addImage);
router.get('/admin/deleteimg/:id', middleware.checkAdminToken,admin.deleteImage);
router.post('/admin/addcat', middleware.checkAdminToken,admin.addCat);
router.post('/admin/editcat/:id', middleware.checkAdminToken,admin.editCat);
router.get('/admin/getall/:type/:pageno?', middleware.checkAdminToken,admin.getAll);
router.get('/admin/deletecat/:id', middleware.checkAdminToken,admin.deleteCat);

router.post('/admin/editallcat', middleware.checkAdminToken,admin.editAllImg);
router.get('/admin/subcat/:id', middleware.checkAdminToken,admin.subCat);

router.post('/admin/importcsv', middleware.checkAdminToken, upload.single('csv_data'),admin.importCsv);

router.post('/admin/react_login',admin.reactLogin);
router.post('/admin/react_images', middleware.checkAdminToken,admin.reactImages);
router.post('/admin/react_users', middleware.checkAdminToken,admin.reactUsers);
router.post('/admin/react_addImage', middleware.checkAdminToken,admin.reactAddImage);
router.put('/admin/react_editImage/:id', middleware.checkAdminToken,admin.reactAddImage);
router.delete('/admin/deleteImage/:id', middleware.checkAdminToken,admin.reactDeleteImage);
router.get('/admin/cat', middleware.checkAdminToken,admin.reactCat);

router.post('/admin/react_addCat', middleware.checkAdminToken,admin.reatAddCat);
router.put('/admin/react_editCat/:id', middleware.checkAdminToken,admin.reatAddCat);
router.delete('/admin/react_deleteCat/:id', middleware.checkAdminToken,admin.reactDeleteCat);
router.get('/admin/react_subcat/:id', middleware.checkAdminToken,admin.reactSubCat);

router.get('/admin/react_home', middleware.checkAdminToken,admin.reactHomeData);

router.post('/admin/reactimportcsv', middleware.checkAdminToken, upload.single('csv_data'),admin.react_ImportCsv);

module.exports = router;