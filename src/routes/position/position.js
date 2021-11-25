var express = require('express');
var router = express.Router();

var sequelize = require('sequelize');
var op = sequelize.Op;
var voca = require('voca');

var positionUtil = require('../../module/positionUtil');
var scheduleUtil = require('../../module/scheduleUtil');
var userUtil = require('../../module/userUtil');
var timeUtil = require('../../module/timeUtil');
var taskUtil = require('../../module/taskUtil');

const { user, position, task, time, schedule, worker, manager } = require('../../models');
const models = require('../../models');

const now = new Date();
const yearNow = now.getFullYear();
const monthNow = now.getMonth()+1;
const dateNow = now.getDate();

//포지션 추가하기
router.post('/',userUtil.LoggedIn, async (req,res)=> {

    // 한 매장 당 3명까지 포시션 추가하도록

    try {
        console.log(req.id,req.job);
        const userId = req.id;
        if (req.job[0] != 'M') {
            console.log("user is not manager");
            res.json({
                code: "202",
                message: "근무자는 포지션을 추가할 수 없습니다."
            });
            return;
        }
        const managerData = await manager.findOne({where: {id: req.job.substring(1)}});
        const {rank, title, startTime, endTime, breakTime} = req.body;
        let {salary, salaryType, workDays, taskLists} = req.body;


        let salary_type = {"시급": 0, "주급": 1, "월급": 2};
        salary = voca.replaceAll(salary, ',', '');
        salary = voca.replaceAll(salary, ' ', '');

        //1. 파라미터체크
        if (!userId || !rank || !title || !startTime || !endTime || !breakTime || !workDays || !salary || !salaryType) {
            console.log("not enough parameter");
            res.json({
                code: "202",
                message: "필수 정보가 부족합니다."
            });
            return;
        }

        let code = await positionUtil.makeRandomCode();
        salaryType = salary_type[salaryType];
        let workDay = workDays.join(',');
        let breakTimes = breakTime == "없음" ? "0000" : (breakTime == "30분"? "0030" : "0100");

        let positionData = {
            shop_id: managerData.shop_id,
            code: code,
            title: title,
            rank: rank,
            salary: salary,
            salary_type: salaryType,
            work_day: workDay,
            start_time: startTime,
            end_time: endTime,
            work_time: timeUtil.subtract(breakTimes, timeUtil.subtract(startTime, endTime)),
            break_time: breakTime
        };

        //2. 포지션 생성
        models.sequelize.transaction(t => {
            return models.position.create(positionData, {transaction: t})
                .then(async (newPosition) => {

                    //3. 포지션 요일별 시간 생성
                    for (const day of workDays) {
                        if (day.length > 1)
                            continue;

                        let timeData = {
                            status: 1,
                            target_id: newPosition.id,
                            day: day,
                            start_time: startTime,
                            end_time: endTime
                        };

                        await models.time.create(timeData, {transaction: t})
                            .catch((err) => {
                                console.log("time server error: ", err);
                                res.json({
                                    code: "400",
                                    message: "포지션 요일별 영업시간 등록에 오류가 발생했습니다."
                                });
                                return;
                            });
                    }
                    ;

                    //4. 포지션 업무리스트 생성
                    if (taskLists) {
                        for (const task of taskLists) {

                            if (!task.title) {
                                console.log("not enough parameter: ");
                                res.json({
                                    code: "202",
                                    message: "업무명을 입력해주세요."
                                });
                                return;
                            }

                            let taskData = {
                                shop_id: managerData.shop_id,
                                writer_job: req.job,
                                status: 0,
                                title: task.title,
                                content: task.content,
                                target_id: newPosition.id
                            };

                            await models.task.create(taskData, {transaction: t})
                                .catch((err) => {
                                    console.log("task server error: ", err);
                                    res.json({
                                        code: "400",
                                        message: "포지션 업무등록에 오류가 발생했습니다."
                                    });
                                    return;
                                });
                        }
                        ;
                    }

                })
                .then(() => {
                    console.log("success create position");
                    res.json({
                        code: "200",
                        message: "성공적으로 포지션 등록을 완료했습니다."
                    });
                    return;
                });
            /*.catch((err) => {
                console.log("position server error: ", err);
                res.status(400).json({
                    message:"포지션 등록에 오류가 발생했습니다."
                });
                return;
            })*/
        });
    }
    catch(err) {
        console.log("position server error: ", err);
        res.json({
            code: "400",
            message:"포지션 등록에 오류가 발생했습니다."
        });
        return;
    }
});

// 포지션 변경 전 조회하기
router.get('/:positionId',userUtil.LoggedIn, async (req,res)=> {


    const positionId = req.params.positionId;
    const positionProfileResult = await positionUtil.getPositionProfile(positionId);
    if (positionProfileResult.code == "400"){
        return res.json(positionProfileResult);
    }

    const positionInfoResult = await positionUtil.getPositionInfo(positionId);
    if (positionInfoResult.code == "400"){
        return res.json(positionInfoResult);
    }

    const positionTaskListResult = await taskUtil.getPositionTaskList(req.params.positionId);
    if (positionTaskListResult.code == "400"){
        return res.json(positionTaskListResult);
    }

    let taskResult = [];
    for(let tl of positionTaskListResult.data){
        let task = {
            id: tl.dataValues.id,
            title: tl.dataValues.title,
            content: tl.dataValues.content
        }
        taskResult.push(task);
    }

    let positionResult = {
        rank: positionProfileResult.data.rank,
        title: positionProfileResult.data.title,
        workDay: positionInfoResult.data.dataValues.workDay.split(' '),
        startTime: positionInfoResult.data.dataValues.startTime,
        endTime: positionInfoResult.data.dataValues.endTime,
        breakTime: positionInfoResult.data.dataValues.breakTime,
        salaryType: positionInfoResult.data.dataValues.salaryType,
        salary: positionInfoResult.data.dataValues.salary,
        taskList: taskResult
    };

    res.json ({
        code: "200",
        message: "포지션 편집하기 전 포지션 정보조회를 성공했습니다.",
        data: positionResult
    });
    return;
});

// 포지션 변경하기
router.post('/:positionId',userUtil.LoggedIn, async (req,res)=> {

    try {
        // 1. 변경 전 데이터
        const positionId = req.params.positionId;
        const positionProfileResult = await positionUtil.getPositionProfile(positionId);
        const positionInfoResult = await positionUtil.getPositionInfo(positionId);
        const positionTaskListResult = await taskUtil.getPositionTaskList(req.params.positionId);

        let taskResult = [];
        for (let tl of positionTaskListResult.data) {
            let task = {
                id: tl.dataValues.id,
                title: tl.dataValues.title,
                content: tl.dataValues.content
            }
            taskResult.push(task);
        }

        const before = {
            rank: positionProfileResult.data.rank,
            title: positionProfileResult.data.title,
            workDay: positionInfoResult.data.dataValues.workDay.split(' '),
            startTime: positionInfoResult.data.dataValues.startTime,
            endTime: positionInfoResult.data.dataValues.endTime,
            breakTime: positionInfoResult.data.dataValues.breakTime,
            salaryType: positionInfoResult.data.dataValues.salaryType,
            salary: positionInfoResult.data.dataValues.salary,
            taskList: taskResult
        };

        // 2. 변경 후 데이터
        const {rank, title, workDay, startTime, endTime, breakTime, salaryType, salary, taskList} = req.body;

        // 3. 파라미터 값 확인
        if (!rank || !title || !workDay || !startTime || !endTime || !breakTime || (salaryType < 0 || salaryType > 2) || !salary) {
            res.json({
                code: "202",
                message: "필수 정보가 부족합니다."
            });
            return;
        }

        // 4. 근무요일, 근무시간 변경여부 확인하기
        let timeChange = false;
        if (before.workDay.length != workDay.length || before.workDay.concat().sort().toString() != workDay.concat().sort().toString())
            timeChange = true;

        // 5. 포지션 업데이트 시작
        let breakTimes = breakTime == "없음" ? "0000" : (breakTime == "30분" ? "0030" : "0100");
        let positionData = {
            title: title,
            rank: rank,
            salary: salary,
            salary_type: salaryType,
            work_day: workDay.join(','),
            start_time: startTime,
            end_time: endTime,
            work_time: timeUtil.subtract(breakTimes, timeUtil.subtract(startTime, endTime)),
            break_time: breakTime
        };

        try {
            await position.update(positionData, {where: {id: positionId}});
            console.log("success to update position");
        } catch (err) {
            console.log("update position error", err);
            res.json({
                code: "400",
                message: "포지션 편집에 오류가 발생했습니다."
            });
            return;
        }

        // 6.근무시간 변경에 따라 업데이트하기
        if (timeChange) {
            try {
                await time.destroy({where: {status: 1, target_id: positionId}});
                console.log("success to delete time");
            } catch(err) {
                console.log("delete time error", err);
                res.json({
                    code: "400",
                    message: "기존 근무시간 삭제에 오류가 발생했습니다."
                });
                return;
            }

            for (const day of workDay) {
                if (day.length > 1)
                    continue;

                let timeData = {
                    status: 1,
                    target_id: positionId,
                    day: day,
                    start_time: startTime,
                    end_time: endTime
                };

                try {
                    await time.create(timeData);
                } catch (err) {
                    console.log("create time error", err);
                    res.json({
                        code: "400",
                        message: "새로운 근무시간 생성에 오류가 발생했습니다."
                    });
                    return;
                }
            }
            console.log("success to create time");
        }

        // 9. 근무자 존재시, 스케줄 삭제, 재생성
        const workerData = await worker.findAll({where: {position_id: positionId}});
        if (workerData.length > 0) {

            // 오늘의 날짜

            const query = ` delete 
                        from schedule
                        where worker_id = ${workerData[0].id}
                        and ((year+0 > ${yearNow}) 
                        or (year+0 = ${yearNow} and month+0 > ${monthNow})
                        or (year+0 = ${yearNow} and month+0 = ${monthNow} and day+0 > ${dateNow}))`;

            try {
                await schedule.sequelize.query(query);
                console.log("success to delete schedule");
            } catch (err) {
                console.log("delete schedule error", err);
                res.json({
                    code: "400",
                    message: "근무자의 기존 스케줄 삭제에 오류가 발생했습니다."
                });
                return;
            }

            try {
                // 1일부터 100일치 스케줄 생성
                await scheduleUtil.makeASchedule(positionId, 1);
                console.log("success to create new schedule error");

            } catch (err) {
                console.log("create new schedule error", err);
                res.json({
                    code: "400",
                    message: "근무자의 새로운 스케줄 삭제에 오류가 발생했습니다."
                });
                return;
            }

        }

        // 7. 업무리스트 변경여부 확인하고 업데이트하기
        if (before.taskList && taskList) {
            for (const bt of before.taskList) {
                let tmp = false;
                for (const t of taskList) {
                    if (t.id && bt.id == t.id) {
                        tmp = true;

                        if (!t.title) {
                            console.log("no task title");
                            res.json({
                                code: "202",
                                message: "기존업무의 업무명을 입력해주세요."
                            });
                            return;
                        }

                        if (bt.title != t.title || bt.content != t.content) {
                            try {
                                await task.update({
                                    title: t.title,
                                    content: t.content,
                                    writer_job: req.job
                                }, {where: {id: t.id}});
                            } catch (err) {
                                res.json({
                                    code: "400",
                                    message: "포지션 업무편집에 오류가 발생했습니다."
                                });
                                return;
                            }
                        }
                    }
                }
                if (tmp == false) {
                    try {
                        await task.destroy({where: {id: bt.id}});
                    } catch (err) {
                        res.json({
                            code: "400",
                            message: "포지션 업무삭제에 오류가 발생했습니다."
                        });
                        return;
                    }
                }
            }
        }

        // 8. 새로운 업무리스트 추가하기
        if (taskList) {
            let positionData = await position.findOne({attributes: ['shop_id'], where: {id: positionId}});
            let newTaskList = taskList.filter(t => !t.id);
            for (const nt of newTaskList) {

                if (!nt.title) {
                    console.log("not enough parameter");
                    res.json({
                        code: "202",
                        message: "새로운 업무의 업무명을 입력해주세요."
                    });
                    return;
                }

                let taskData = {
                    shop_id: positionData.shop_id,
                    writer_job: req.job,
                    status: 0,
                    title: nt.title,
                    content: nt.content,
                    target_id: positionId
                };

                try {
                    await task.create(taskData);
                } catch (err) {
                    console.log("create task error", err);
                    res.json({
                        code: "400",
                        message: "포지션 업무생성에 오류가 발생했습니다."
                    });
                    return;
                }

            }
        }

        console.log("success to update all position");
        res.json({
            code: "200",
            message: "포지션 전체 편집을 성공했습니다."
        });
        return;

    }
    catch(err) {
        console.log("update all position error", err);
        res.json({
            code: "400",
            message: "포지션 전체 편집에 오류가 발생했습니다."
        });
        return;
    }

});

// 포지션 삭제
router.delete('/:positionId', userUtil.LoggedIn, async (req,res)=> {

    try {
        // 1. worker가 존재하는지 확인
        const positionId = req.params.positionId;
        const workerCount = await worker.count({where: {position_id: positionId}});

        if(workerCount > 0){
            console.log("worker already exist");
            res.json({
                code: "202",
                message: "포지션에 근무자가 존재합니다."
            });
            return;
        }

        // 2. position의 time 삭제
        try {
            await time.destroy({where: {status: 1, target_id: positionId}});
            console.log("success to delete position's time data");

        } catch (err) {
            console.log("delete position's time data error", err);
            res.json({
                code: "400",
                message: "포지션의 근무시간 삭제에 오류가 발생했습니다."
            });
            return;
        }

        // 3. position의 task 삭제
        try {
            await task.destroy({where: {status: 0, target_id: positionId}});
            console.log("success to delete position's task data");

        } catch (err) {
            console.log("delete position's task data error", err);
            res.json({
                code: "400",
                message: "포지션업무 삭제에 오류가 발생했습니다."
            });
            return;
        }

        // 4. position 삭제
        try {
            await position.destroy({where: {id: positionId}});
            console.log("success to delete position data");

        } catch (err) {
            console.log("delete position data error", err);
            res.json({
                code: "400",
                message: "포지션 삭제에 오류가 발생했습니다."
            });
            return;
        }

        console.log("success to delete position");
        res.json({
            code: "200",
            message: "포지션 삭제를 성공했습니다."
        });
        return;

    }
    catch(err) {
        console.log("delete position error", err);
        res.json({
            code: "400",
            message: "포지션 삭제 과정에서 오류가 발생했습니다."
        });
        return;
    }

});


module.exports = router;