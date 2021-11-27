var express = require('express');
var router = express.Router();

router.use('/', require('./taskInfo'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'taskInfo' });
});


module.exports = router;