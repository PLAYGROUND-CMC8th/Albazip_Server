var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../module/userUtil');
var taskUtil = require('../../../module/taskUtil');

const { task, position, worker, manager } = require('../../../models');


// 근무자: 홈 > 오늘의 할일
router.get('/worker', userUtil.LoggedIn, async (req,res)=> {

    try {
        const workerData = await worker.findOne({where: {id: req.job.substring(1)}});
        const positionData = await position.findOne({where: {id: workerData.position_id}});

        const todayCoTaskResult = await taskUtil.getTodayCoTask(positionData.shop_id);
        if (todayCoTaskResult.code == "400")
            return res.json(todayCoTaskResult);

        const todayPerTaskResult = await taskUtil.getTodayPerTask(workerData.id);
        if (todayPerTaskResult.code == "400")
            return res.json(todayPerTaskResult);

        console.log("success to get worker today task");
        res.json({
            code: "200",
            message: "근무자의 오늘의 할일 전체 조회를 성공했습니다.",
            data: {
                coTask: todayCoTaskResult.data,
                perTask: todayPerTaskResult.data
            }
        })
        return;
    }
    catch(err) {
        console.log("get worker today task error", err);
        res.json({
            code: "400",
            message: "근무자의 오늘의 할일 전체 조회에 오류가 발생했습니다."
        })
        return;
    }


});

// 관리자: 홈 > 오늘의 할일
router.get('/manager', userUtil.LoggedIn, async (req,res)=> {

    try {
        const managerData = await manager.findOne({where: {id: req.job.substring(1)}});

        const todayCoTaskResult = await taskUtil.getTodayCoTask(managerData.shop_id);
        if (todayCoTaskResult.code == "400")
            return res.json(todayCoTaskResult);

        const todayPerTaskListResult = await taskUtil.getTodayPerTaskList(managerData.shop_id);
        if (todayPerTaskListResult.code == "400")
            return res.json(todayPerTaskListResult);

        console.log("success to get manager today task");
        res.json({
            code: "200",
            message: "관리자의 오늘의 할일 전체 조회를 성공했습니다.",
            data: {
                coTask: todayCoTaskResult.data,
                perTask: todayPerTaskListResult.data
            }
        })
        return;
    }
    catch(err) {
        console.log("get manager today task error", err);
        res.json({
            code: "400",
            message: "관리자의 오늘의 할일 전체 조회에 오류가 발생했습니다."
        })
        return;
    }

});

// 관리자, 근무자: 홈 > 오늘의 할일 > 공동업무
router.get('/coTask', userUtil.LoggedIn, async (req,res)=> {

    try {
        let shopId;
        if (req.job[0] == "M") {
            const managerData = await manager.findOne({where: {id: req.job.substring(1)}});
            shopId = managerData.shop_id;

        } else if (req.job[0] == "W") {
            const workerData = await worker.findOne({where: {id: req.job.substring(1)}});
            const positionData = await position.findOne({where: {id: workerData.position_id}});
            shopId = positionData.shop_id;
        }

        const todayCoTaskResult = await taskUtil.getTodayCoTask(shopId);
        return res.json(todayCoTaskResult);
    }
    catch(err) {
        console.log("get today cooperate task error", err);
        res.json({
            code: "400",
            message: "오늘의 할일 공동업무 조회에 오류가 발생했습니다."
        })
        return;
    }


});

// 관리자: 홈 > 오늘의 할일 > 포지션별 개인업무
router.get('/manager/workerPerTask', userUtil.LoggedIn, async (req,res)=> {

    try {
        const managerData = await manager.findOne({where: {id: req.job.substring(1)}});

        const todayPerTaskListResult = await taskUtil.getTodayPerTaskList(managerData.shop_id);
        return res.json(todayPerTaskListResult);
    }
    catch(err) {
        console.log("get worker's personal today task error", err);
        res.json({
            code: "400",
            message: "오늘의 할일 포지션별 개인업무 조회에 오류가 발생했습니다."
        })
        return;
    }

});

// 근무자: 홈 > 오늘의 할일 > 개인업무
router.get('/worker/perTask', userUtil.LoggedIn, async (req,res)=> {

    const todayPerTaskResult = await taskUtil.getTodayPerTask(req.job.substring(1));
    return res.json(todayPerTaskResult);

});

// 관리자: 홈 > 오늘의 할일 > 포지션별 개인업무 > 포지션 개인업무
router.get('/manager/workerPerTask/:workerId', userUtil.LoggedIn, async (req,res)=> {

    const todayPerTaskResult = await taskUtil.getTodayPerTask(req.params.workerId);
    return res.json(todayPerTaskResult);

});

// 업무 완료하기 및 되돌리기
router.put('/:taskId', userUtil.LoggedIn, async (req,res)=> {

    const taskId = req.params.taskId;
    const taskData = await task.findOne({where: {id: taskId}});

    try {
        console.log(taskData.completer_job);
        if (!taskData.completer_job) {
            await task.update({completer_job: req.job}, {where: {id: taskId}});
            console.log("success to complete task");
            return res.json({
                code: "200",
                message: "업무완료하기를 성공했습니다."
            });

        }
        else {
            await task.update({completer_job: null}, {where: {id: taskId}});
            console.log("success to return task");
            return res.json({
                code: "200",
                message: "업무되돌리기를 성공했습니다."
            });
        }
    }
    catch(err){
        console.log("complete or return task error", err);
        return res.json({
            code: "400",
            message: "업무 완료 및 되돌리기에 오류가 발생했습니다."
        });
    }

});

// 공동업무 추가하기
router.post('/coTask', userUtil.LoggedIn, async (req,res)=> {

    const coTaskList = req.body.coTaskList;
    const managerData = await manager.findOne({attributes:['shop_id'], where: {id: req.job.substring(1)}});
    const writerJob = req.job;

    let count = 0;
    try {
        if (coTaskList.length > 0) {
            for (const coTask of coTaskList) {

                // 필수값 확인
                if (!coTask.title) {
                    console.lot("not enough parameter");
                    res.json({
                        code: "202",
                        message: "업무명을 입력해주세요."
                    });
                    return;
                }

                await task.create({
                    shop_id: managerData.shop_id,
                    writer_job: writerJob,
                    status: 1,
                    title: coTask.title,
                    content: coTask.content
                });
                count += 1;
            }
        }

        console.log("success to make new cooperate tasks");
        res.json({
            code: "200",
            message: `${count}개의 공동업무 생성에 성공했습니다.`
        });
        return;
    }
    catch(err) {
        console.log("make new cooperate tasks error", err);
        res.json({
            code: "400",
            message: `공동업무 생성에 실패했습니다. (성공 ${count}개, 실패 ${coTaskList.length-count}개)`
        });
        return;
    }

});

// 개인업무 추가하기


// 업무 삭제하기


module.exports = router;
