const express = require('express');
const router = express.Router();

const apis = require('../controllers/apis');

router.get('/',(req, res) => {
    res.send('Welcome!');
});

router.post('/login',apis.login);



module.exports = router;