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


// 첫 집입시 토큰 유효성 확인
var userUtil = require('../module/userUtil');
var { manager, worker } = require('../models');

router.get('/token', userUtil.LoggedIn, async (req,res)=>{

  try {
    let jobCount;
    if (req.job[0] == "M")
      jobCount = await manager.count({where: {id: req.job.substring(1)}});
    else if (req.job[0] == "W")
      jobCount = await worker.count({where: {id: req.job.substring(1)}});

    if (jobCount > 0) {
      console.log("valid token");
      return res.json({
        code: "200",
        message: "유효한 토큰입니다.",
        status: 1
      });
    } else {
      console.log("invalid token");
      return res.json({
        code: "202",
        message: "유효하지 않은 토큰입니다.",
        status: 0
      });
    }
  }
  catch(err) {
    console.log("token validation error", err);
    return res.json({
      code: "400",
      message: "토큰 유효성 확인에 오류가 발생했습니다."
    });
  }

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
