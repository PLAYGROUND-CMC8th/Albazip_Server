var express = require('express');
var router = express.Router();

router.use('/', require('./home'));
router.use('/todayTask', require('./todayTask'));
router.use('/shopList', require('./shopList'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'home' });
});


module.exports = router;
