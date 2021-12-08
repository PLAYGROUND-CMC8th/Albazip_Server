var express = require('express');
var router = express.Router();

router.use('/', require('./board'));
router.use('/notice', require('./notice'));
router.use('/post', require('./post'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'board' });
});


module.exports = router;
