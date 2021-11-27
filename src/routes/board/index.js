var express = require('express');
var router = express.Router();

router.use('/', require('./board'));
router.use('/notice', require('./notice'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'board' });
});


module.exports = router;
