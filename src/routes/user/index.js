var express = require('express');
var router = express.Router();

router.use('/signup', require('./signup'));
router.use('/signin',require('./signin'));
router.use('/profile',require('./profile'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'auth' });
});


module.exports = router;
