var express = require('express');
var router = express.Router();

router.use('/', require('./shopList'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'shopList' });
});


module.exports = router;