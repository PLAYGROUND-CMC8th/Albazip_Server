var express = require('express');
var router = express.Router();

router.use('/', require('./schedule'));


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'schedule' });
});


module.exports = router;
