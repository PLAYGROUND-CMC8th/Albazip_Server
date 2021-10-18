var express = require('express');
var router = express.Router();

router.use('/', require('./signin'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'signin' });
});


module.exports = router;