var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../../module/userUtil');
var scheduleUtil = require('../../../../module/scheduleUtil');

const { worker } = require('../../../../models');


// 마이페이지보 > 하단 > 내정보 > 지각횟수 > 월별
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    const now = new Date();
    const yearNow = now.getFullYear();
    const monthNow = now.getMonth() + 1;

    const commuteRecordResult = await scheduleUtil.getCommuteRecord(req.job.substring(1), yearNow, monthNow);
    return res.json(commuteRecordResult);

});

router.get('/:year/:month', userUtil.LoggedIn, async (req,res)=> {

    const { year, month } = req.params;

    const commuteRecordResult = await scheduleUtil.getCommuteRecord(req.job.substring(1), year, month);
    return res.json(commuteRecordResult);

});


module.exports = router;