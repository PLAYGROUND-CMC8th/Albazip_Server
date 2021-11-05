var express = require('express');
var router = express.Router();

router.use('/user', require('./user'));
router.use('/shop', require('./shop'));
router.use('/position', require('./position'));
router.use('/schedule', require('./schedule'));
router.use('/mypage', require('./mypage'));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
