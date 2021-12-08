var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var jwt = require('../../../module/jwt');
var userUtil = require('../../../module/userUtil');
var positionUtil = require('../../../module/positionUtil');
var taskUtil = require('../../../module/taskUtil');
var workerUtil = require('../../../module/workerUtil');
var scheduleUtil = require('../../../module/scheduleUtil');

const { user, worker, manager, schedule, position } = require('../../../models');


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

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보
router.get('/:positionId/workerInfo',userUtil.LoggedIn, async (req,res)=> {

    const workerInfoResult = await positionUtil.getWorkerInfo(req.params.positionId);
    return res.json(workerInfoResult);

});


// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 지각횟수
router.get('/:positionId/workerInfo/lateCount',userUtil.LoggedIn, async (req,res)=> {

    const positionId = req.params.positionId;

    let workerData;
    try {
        workerData = await worker.findOne({ attributes: ['register_date'], where : {position_id: positionId}})
    }
    catch(err) {
        workerData = null;
    }
    const lateCountResult = await workerUtil.getLateCount(positionId, workerData.register_date);
    return res.json(lateCountResult);
});

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 지각횟수 > 출퇴근기록
router.get('/:positionId/workerInfo/commuteInfo',userUtil.LoggedIn, async (req,res)=> {

    const positionId = req.params.positionId;

    const now = new Date();
    const yearNow = now.getFullYear();
    const monthNow = now.getMonth() + 1;

    const commuteRecordResult = await scheduleUtil.getCommuteRecord(positionId, yearNow, monthNow);
    return res.json(commuteRecordResult);


});

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 지각횟수 > 출퇴근기록 > 월별조회
router.get('/:positionId/workerInfo/commuteInfo/:year/:month',userUtil.LoggedIn, async (req,res)=> {

    const { positionId, year, month } = req.params;

    const commuteRecordResult = await scheduleUtil.getCommuteRecord(positionId, year, month);
    return res.json(commuteRecordResult);

});


// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 공동업무 참여횟수
router.get('/:positionId/workerInfo/coTaskCount',userUtil.LoggedIn, async (req,res)=> {

    const positionId = req.params.positionId;

    let workerData;
    try {
        workerData = await worker.findOne({ attributes: ['register_date'], where : {position_id: positionId }})
    }
    catch(err) {
        workerData = null;
    }
    console.log(workerData);
    const coTaskCountResult = await workerUtil.getCoTaskCount(positionId, workerData.register_date);
    return res.json(coTaskCountResult);

});

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 공동업무
router.get('/:positionId/workerInfo/coTaskInfo',userUtil.LoggedIn, async (req,res)=> {

    const positionId = req.params.positionId;
    const coTaskInfoResult = await taskUtil.getCotaskInfo(positionId);
    return res.json(coTaskInfoResult);

});

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 공동업무 (카이트)
router.get('/:positionId/workerInfo/coTaskInfoK',userUtil.LoggedIn, async (req,res)=> {

    const positionId = req.params.positionId;
    const coTaskInfoResult = await taskUtil.getCotaskInfoK(positionId);
    return res.json(coTaskInfoResult);

});

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 업무 완수율
router.get('/:positionId/workerInfo/taskRate',userUtil.LoggedIn, async (req,res)=> {

    const positionId = req.params.positionId;

    let workerData;
    try {
        workerData = await worker.findOne({ attributes: ['register_date'], where : {position_id: positionId}})
    }
    catch(err) {
        workerData = null;
    }
    const completeTaskInfo = await workerUtil.getTaskRate(positionId, workerData.register_date);
    return res.json(completeTaskInfo);

});

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 업무 완수율 > 전체 조회
router.get('/:positionId/workerInfo/taskInfo',userUtil.LoggedIn, async (req,res)=> {

    const positionId = req.params.positionId;
    const completeTaskTotalResult = await taskUtil.getCompleteTaskTotal(positionId);
    return res.json(completeTaskTotalResult);

});

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 업무 완수율 > 월별 조회
router.get('/:positionId/workerInfo/taskInfo/:year/:month',userUtil.LoggedIn, async (req,res)=> {

    const { positionId, year, month } = req.params;
    const completeTaskMonthResult = await taskUtil.getCompleteTaskMonth(positionId, year, month);
    return res.json(completeTaskMonthResult);

});

// 마이페이지 > 하단 > 근무자 > 근무자 존재 > 근무자 선택 > 하단 > 근무자 정보 > 업무 완수율 > 일별 조회
router.get('/:positionId/workerInfo/taskInfo/:year/:month/:date',userUtil.LoggedIn, async (req,res)=> {

    const { positionId, year, month, date } = req.params;
    const completeTaskDateResult = await taskUtil.getCompleteTaskDate(positionId, year, month, date);
    return res.json(completeTaskDateResult);

});


// 마이페이지 > 하단 > 근무자 > 근무자 부재 > 근무자 선택 > 하단 > 근무자 정보
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

// 마이페이지 > 하단 > 근무자 > 근무자 선택 > 퇴사 거절하기
router.put('/:positionId',userUtil.LoggedIn, async (req,res)=> {

    try {
        // 관리자인지 확인
        if (req.job[0] != 'M') {
            console.log("manager can only deny resign worker");
            res.json({
                code: "202",
                message: "관리자만 포지션 퇴사 거절을 할 수 있습니다."
            });
            return;
        }

        const positionId = req.params.positionId;
        await worker.update({status: 1}, {where: {position_id: positionId}});
        console.log("success to deny position resign request");

        res.json({
            code: "200",
            message: "포지션 퇴사요청 거절을 성공했습니다."
        });
        return;
    }
    catch(err){
        console.log("deny position resign request error", err);
        res.json({
            code: "400",
            message: "포지션 퇴사요청 거절에 오류가 발생했습니다."
        });
        return;
    }

});

// 마이페이지 > 하단 > 근무자 > 근무자 선택 > 퇴사하기
router.delete('/:positionId',userUtil.LoggedIn, async (req,res)=> {

    try {
        // 관리자인지 확인
        if (req.job[0] != 'M') {
            console.log("manager can only resign worker");
            res.json({
                code: "202",
                message: "관리자만 포지션을 퇴사시킬 수 있습니다."
            });
            return;
        }

        // 포지션 코드 갱신
        const positionId = req.params.positionId;
        try {
            const newCode = await positionUtil.makeRandomCode();
            await position.update({code: newCode}, {where: {id: positionId}});
            console.log("success to update position code");
        } catch (err) {
            console.log("update position code error", err);
            res.json({
                code: "400",
                message: "포지션 코드 업데이트에 오류가 발생했습니다."
            })
            return;
        }


        // worker 삭제
        const workerData = await worker.findOne({attributes: ['id', 'user_id'], where: {position_id: positionId}});
        const userId = workerData.user_id;
        const deleteWorkerResult = await userUtil.deleteWorker(workerData.id);
        if (deleteWorkerResult.code == "400")
            return res.json(deleteWorkerResult);

        console.log("success to update user last job");
        res.json({
            code: "200",
            message: "근무자 퇴사를 성공했습니다.",
            //token: token
        });
        return;
    }
    catch(err){
        console.log(" update user last job error", err);
        res.json({
            code: "400",
            message: "근무자 퇴사에 오류가 발생했습니다."
        });
        return;
    }


});


module.exports = router;