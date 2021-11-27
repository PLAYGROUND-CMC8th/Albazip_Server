var express = require('express');
var router = express.Router();

router.use('/', require('./workers'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'workers' });
});


module.exports = router;