var express = require('express');
var router = express.Router();

router.use('/user', require('./user'));
router.use('/shop', require('./shop'));
router.use('/position', require('./position'));
router.use('/schedule', require('./schedule'));
router.use('/mypage', require('./mypage'));
router.use('/home', require('./home'));
router.use('/board', require('./board'));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


// test pushAlarm
var pushAlarm = require('../module/pushAlarm');

router.get('/kite', pushAlarm.testKite, async (req,res)=>{
  return;
});

router.get('/chobi', pushAlarm.testChobi, async (req,res)=>{
  return;
});

// make task manually
var taskUtil = require('../module/taskUtil');
router.get('/task', async (req,res)=> {

  await taskUtil.makeAllTask();
  res.json({
    code:"200",
    message: "업무를 수동생성에 성공했습니다."
  })
  return;
});

module.exports = router;
