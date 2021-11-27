var express = require('express');
var router = express.Router();

router.use('/', require('./commuteInfo'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'commuteInfo' });
});


module.exports = router;