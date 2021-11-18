var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../module/userUtil');
var positionUtil = require('../../../module/positionUtil');
var workerUtil = require('../../../module/workerUtil');

const { worker } = require('../../../models');


// 마이페이지보 > 하단 > 내정보
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)} });
    } catch(err) {
        workerData = null;
    }

    const myinfoResult = await positionUtil.getWorkerInfo(workerData.position_id);
    if (myinfoResult.code == "400"){
        return res.json(myinfoResult);
        return;
    }

    res.json({
        code: "200",
        message: "마이페이지 내정보 조회에 성공했습니다. ",
        data: myinfoResult.data
    });
    return;

});

// 마이페이지 > 하단 > 내정보 > 지각횟수
router.get('/lateCount',userUtil.LoggedIn, async (req,res)=> {

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)}});
    }
    catch(err) {
        workerData = null;
    }
    const lateCountResult = await workerUtil.getLateCount(workerData.position_id, workerData.register_date);
    return res.json(lateCountResult);
});


// 마이페이지 > 하단 > 내정보 > 공동업무 참여횟수
router.get('/coTaskCount',userUtil.LoggedIn, async (req,res)=> {

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)}});
    }
    catch(err) {
        workerData = null;
    }

    const coTaskCountResult = await workerUtil.getCoTaskCount(workerData.position_id, workerData.register_date);
    return res.json(coTaskCountResult);

});

// 마이페이지 > 하단 > 내정보 > 업무 완수율
router.get('/taskRate',userUtil.LoggedIn, async (req,res)=> {

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)}});
    }
    catch(err) {
        workerData = null;
    }
    const completeTaskInfo = await workerUtil.getTaskRate(workerData.position_id, workerData.register_date);
    return res.json(completeTaskInfo);

});

// 마이페이지 하단 퇴사요청
router.put('/resign', userUtil.LoggedIn, async (req,res)=> {

    if(req.job[0] != 'W'){
        res.json({
            code: "202",
            message: "퇴사요청은 근무자만 할 수 있습니다."
        });
        return;
    }

    worker.update({status: 2}, {where: {id: req.job.substring(1)}})
        .then(updateWorker => {

            console.log("success to update user resign request");
            res.status(200).json({
                code: "200",
                message:"근무자 퇴사 요청을 신청했습니다."
            });
            return;
        })
        .catch((err) => {
            console.log("update user resign request error", err );
            res.json({
                code: "400",
                message: "근무자 퇴사 요청을 신청에 오류가 발생했습니다."
            });
            return;
        });

});

module.exports = router;