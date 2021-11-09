var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../module/userUtil');
var positionUtil = require('../../../module/positionUtil');
var taskUtil = require('../../../module/taskUtil');

// 마이페이지 > 하단 > 근무자
router.get('/',userUtil.LoggedIn, async (req,res)=> {

    const workersListResult = await positionUtil.getWorkersList(req.job.substring(1));
    return res.json(workersListResult);

});

// 마이페이지 > 하단 > 근무자 > 근무자 선택
router.get('/:positionId',userUtil.LoggedIn, async (req,res)=> {


});

// 마이페이지 > 하단 > 근무자 > 근무자 선택 > 상단 > 근무자 프로필
router.get('/:positionId/profile',userUtil.LoggedIn, async (req,res)=> {

    const positionProfiletResult = await positionUtil.getPositionProfile(req.params.positionId);
    return res.json(positionProfiletResult);

});


// 마이페이지 > 하단 > 근무자 > 근무자 선택 > 하단 > 근무자 정보
router.get('/:positionId/workerInfo',userUtil.LoggedIn, async (req,res)=> {

    const workerInfoResult = await positionUtil.getWorkerInfo(req.params.positionId);
    return res.json(workerInfoResult);

});


// 마이페이지 > 하단 > 근무자 > 근무자 선택 > 하단 > 근무자 포지션 정보
router.get('/:positionId/positionInfo',userUtil.LoggedIn, async (req,res)=> {

    const positionInfoResult = await positionUtil.getPositionInfo(req.params.positionId);
    return res.json(positionInfoResult);

});


// 마이페이지 > 하단 > 근무자 > 근무자 선택 > 하단 > 근무자 업무리스트
router.get('/:positionId/taskList',userUtil.LoggedIn, async (req,res)=> {

    const positionTaskListResult = await taskUtil.getPositionTaskList(req.params.positionId);
    return res.json(positionTaskListResult);

});

module.exports = router;