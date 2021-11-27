var express = require('express');
var router = express.Router();

router.use('/', require('./position'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'position' });
});


module.exports = router;