var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../../module/userUtil');
var taskUtil = require('../../../../module/taskUtil');

const { worker } = require('../../../../models');


// 마이페이지보 > 하단 > 내정보 > 공동업무
router.get('/coTaskInfo', userUtil.LoggedIn, async (req,res)=> {

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)} });
    } catch(err) {
        workerData = null;
    }

    const coTaskInfoResult = await taskUtil.getCotaskInfo(workerData.position_id);
    return res.json(coTaskInfoResult);

});

// 마이페이지보 > 하단 > 내정보 > 공동업무 (카이트)
router.get('/coTaskInfoK', userUtil.LoggedIn, async (req,res)=> {

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)} });
    } catch(err) {
        workerData = null;
    }

    const coTaskInfoResult = await taskUtil.getCotaskInfoK(workerData.position_id);
    return res.json(coTaskInfoResult);

});


// 마이페이지보 > 하단 > 내정보 > 업무 완수 정보
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)} });
    } catch(err) {
        workerData = null;
    }

    const completeTaskTotalResult = await taskUtil.getCompleteTaskTotal(workerData.position_id);
    return res.json(completeTaskTotalResult);

});

router.get('/:year/:month', userUtil.LoggedIn, async (req,res)=> {

    const { year, month } = req.params;

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)} });
    } catch(err) {
        workerData = null;
    }

    const completeTaskMonthResult = await taskUtil.getCompleteTaskMonth(workerData.position_id, year, month);
    return res.json(completeTaskMonthResult);

});

router.get('/:year/:month/:date', userUtil.LoggedIn, async (req,res)=> {

    const { year, month, date } = req.params;

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)} });
    } catch(err) {
        workerData = null;
    }

    const completeTaskDateResult = await taskUtil.getCompleteTaskDate(workerData.position_id, year, month, date);
    return res.json(completeTaskDateResult);

});



module.exports = router;