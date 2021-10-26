var express = require('express');
var router = express.Router();

router.use('/', require('./shop'));
router.use('/number', require('./number'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'shop' });
});


module.exports = router;