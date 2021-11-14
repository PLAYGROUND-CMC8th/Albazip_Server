var express = require('express');
var router = express.Router();

//router.use('/', require('./home'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'home' });
});


module.exports = router;
