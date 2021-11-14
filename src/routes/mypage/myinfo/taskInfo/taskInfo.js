var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../../module/userUtil');
var taskUtil = require('../../../../module/taskUtil');

const { worker } = require('../../../../models');


// 마이페이지보 > 하단 > 내정보 > 공동업무
router.get('/coTaskInfo', userUtil.LoggedIn, async (req,res)=> {

    const coTaskInfoResult = await taskUtil.getCotaskInfo(req.job.substring(1));
    return res.json(coTaskInfoResult);

});


// 마이페이지보 > 하단 > 내정보 > 업무 완수 정보
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    const completeTaskTotalResult = await taskUtil.getCompleteTaskTotal(req.job.substring(1));
    return res.json(completeTaskTotalResult);

});

router.get('/:year/:month', userUtil.LoggedIn, async (req,res)=> {

    const { year, month } = req.params;
    const completeTaskMonthResult = await taskUtil.getCompleteTaskMonth(req.job.substring(1), year, month);
    return res.json(completeTaskMonthResult);

});

router.get('/:year/:month/:date', userUtil.LoggedIn, async (req,res)=> {

    const { year, month, date } = req.params;
    const completeTaskDateResult = await taskUtil.getCompleteTaskDate(req.job.substring(1), year, month, date);
    return res.json(completeTaskDateResult);

});



module.exports = router;