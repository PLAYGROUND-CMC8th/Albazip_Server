var express = require('express');
var router = express.Router();

router.use('/', require('./myinfo'));
router.use('/taskInfo', require('./taskInfo'));
router.use('/commuteInfo', require('./commuteInfo'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'myinfo' });
});


module.exports = router;