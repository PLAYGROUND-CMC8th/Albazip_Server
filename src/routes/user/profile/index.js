var express = require('express');
var router = express.Router();

router.use('/', require('./profile'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'profile' });
});


module.exports = router;