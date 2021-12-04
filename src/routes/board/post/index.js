var express = require('express');
var router = express.Router();

router.use('/', require('./post'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'post' });
});


module.exports = router;
