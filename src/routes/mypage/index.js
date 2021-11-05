var express = require('express');
var router = express.Router();

router.use('/', require('./mypage'));
router.use('/boards',require('./boards'));
router.use('/workers', require('./workers'));
router.use('/position', require('./position'));
router.use('/myinfo', require('./myinfo'));
router.use('/profile', require('./profile'));

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'mypage' });
});


module.exports = router;
