var express = require('express');
var router = express.Router();

router.use('/signup', require('./signup'));
router.use('/signin',require('./signin'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'user' });
});


module.exports = router;
