var express = require('express');
var router = express.Router();

router.use('/', require('./notice'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'notice' });
});


module.exports = router;
