var express = require('express');
var router = express.Router();

router.use('/', require('./setting'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'setting' });
});


module.exports = router;