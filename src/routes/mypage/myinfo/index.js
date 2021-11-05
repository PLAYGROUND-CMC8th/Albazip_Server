var express = require('express');
var router = express.Router();

router.use('/', require('./myinfo'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'myinfo' });
});


module.exports = router;