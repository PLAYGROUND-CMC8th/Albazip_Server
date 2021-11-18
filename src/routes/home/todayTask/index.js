var express = require('express');
var router = express.Router();

router.use('/', require('./todayTask'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'todayTask' });
});


module.exports = router;