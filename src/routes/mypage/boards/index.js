var express = require('express');
var router = express.Router();

router.use('/', require('./boards'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'boards' });
});


module.exports = router;