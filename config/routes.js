const express = require('express');
const router = express.Router();

const apis = require('../controllers/apis');
const middleware = require('../config/middleware');

router.get('/',(req, res) => {
    res.send('Welcome!');
});

router.post('/register',apis.register);
router.post('/login',apis.login);
router.put('/edit',middleware.checkToken,apis.register);
router.post('/check_code',middleware.checkToken,apis.check_cupanCode);



module.exports = router;