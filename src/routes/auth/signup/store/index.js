var express = require('express');
var router = express.Router();

router.use('/', require('./store'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'store' });
});


module.exports = router;