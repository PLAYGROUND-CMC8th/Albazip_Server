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

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택
router.get('/:positionId',userUtil.LoggedIn, async (req,res)=> {

    // 근무자 프로필
    const positionProfiletResult = await positionUtil.getPositionProfile(req.params.positionId);
    if( positionProfiletResult.code == "400" ){
        res.json(positionProfiletResult);
        return;
    }

    // 근무자 정보
    const workerInfoResult = await positionUtil.getWorkerInfo(req.params.positionId);
    if( workerInfoResult.code == "400" ){
        res.json(workerInfoResult);
        return;
    }

    // 근무자 포지션
    const positionInfoResult = await positionUtil.getPositionInfo(req.params.positionId);
    if( positionInfoResult.code == "400" ){
        res.json(positionInfoResult);
        return;
    }

    // 근무자 업무리스트
    const positionTaskListResult = await taskUtil.getPositionTaskList(req.params.positionId);
    if( positionTaskListResult.code == "400" ){
        res.json(positionTaskListResult);
        return;
    }

    res.json({
        code: "200",
        message: "근무자 조회에 성공했습니다. ",
        data: {
            positionProfile: positionProfiletResult.data,
            workerInfo: workerInfoResult.data,
            positionInfo: positionInfoResult.data,
            positionTaskList: positionTaskListResult.data
        }
    });
    return;

});

// 마이페이지 > 하단 > 근무자 > 근무자 부재 > 근무자 선택
router.get('/ne/:positionId',userUtil.LoggedIn, async (req,res)=> {

    // 근무자 프로필
    const positionProfiletResult = await positionUtil.getPositionProfile(req.params.positionId);
    if( positionProfiletResult.code == "400" ){
        res.json(positionProfiletResult);
        return;
    }

    // 근무자 정보
    const workerInfoResult = await positionUtil.getWorkerInfo(req.params.positionId);
    if( workerInfoResult.code == "400" ){
        res.json(workerInfoResult);
        return;
    }

    // 근무자 포지션
    const positionInfoResult = await positionUtil.getPositionInfo(req.params.positionId);
    if( positionInfoResult.code == "400" ){
        res.json(positionInfoResult);
        return;
    }

    // 근무자 업무리스트
    const positionTaskListResult = await taskUtil.getPositionTaskList(req.params.positionId);
    if( positionTaskListResult.code == "400" ){
        res.json(positionTaskListResult);
        return;
    }

    res.json({
        code: "200",
        message: "근무자 조회에 성공했습니다. ",
        data: {
            positionProfile: positionProfiletResult.data,
            workerInfo: workerInfoResult.data,
            positionInfo: positionInfoResult.data,
            positionTaskList: positionTaskListResult.data
        }
    });
    return;

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

// 마이페이지 > 하단 > 근무자 > 근무자 선택 > 하단 > 근무자 정보
router.get('/ne/:positionId/workerInfo',userUtil.LoggedIn, async (req,res)=> {

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