var express = require('express');
var router = express.Router();

router.use('/', require('./home'));
router.use('/todayTask', require('./todayTask'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'home' });
});


module.exports = router;
