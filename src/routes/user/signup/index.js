var express = require('express');
var router = express.Router();

router.use('/', require('./signup'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'signup' });
});


module.exports = router;