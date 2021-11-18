var express = require('express');
var router = express.Router();

const publicHolidayApiKey = require('../../config/publicHolidayApiKey');
const holidays = require('holidays-kr');
const sequelize = require('sequelize');


var userUtil = require('../../module/userUtil');
var timeUtil = require('../../module/timeUtil');
var pushAlarm = require('../../module/pushAlarm');

const { manager, worker, shop, position, task, board, schedule, comment } = require('../../models');

const weekdays = [ '일', '월', '화', '수', '목', '금', '토'];

// 관리자
router.get('/manager', userUtil.LoggedIn, async (req,res)=>{

    try {
        let totalData = {};

        // 매장 정보
        const managerData = await manager.findOne({where: {id: req.job.substring(1)}});
        const shopData = await shop.findOne({where: {id: managerData.shop_id}});

        // 오늘 날짜
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth()+1;
        const dateNow = now.getDate();
        const dayNow = now.getDay();
        const hourNow = String(now.getHours()).padStart(2, '0');
        const minNow = String(now.getMinutes()).padStart(2, '0');

        const todayInfo = {
            month: monthNow,
            date: dateNow,
            day: weekdays[dayNow]
        }
        totalData.todayInfo = todayInfo;

        const shopInfo = {
            status: 0, // 0 : 영업 전, 1: 영업 중, 2: 영업 후, 3: 휴무
            name: shopData.name,
            startTime: shopData.start_time,
            endTime: shopData.end_time
        };
        totalData.shopInfo = shopInfo;



        // 공휴일 유무에 따라 shopStatus 결정
        holidays.serviceKey = publicHolidayApiKey.encoding;
        holidays.serviceKey = publicHolidayApiKey.encoding;
        const holidayResult = await holidays.getHolidays({
            year: yearNow,           // 수집 시작 연도
            month: monthNow,         // 수집 시작 월
            monthCount: 1            // 수집 월 갯수
        });

        let publicHolidays = [];
        for(const holiday of holidayResult)
            publicHolidays.push(holiday.month + "/" +holiday.day)

        if(publicHolidays.includes(monthNow+"/"+dateNow) || shopData.holiday.includes(weekdays[dayNow]))
            shopInfo.status = 3;

        if((hourNow > shopData.start_time.substring(0,2))
            || (hourNow == shopData.start_time.substring(0,2) && minNow > shopData.start_time.substring(2,2)))
            shopInfo.status = 1;

        if((hourNow > shopData.end_time.substring(0,2))
            || (hourNow == shopData.end_time.substring(0,2) && minNow > shopData.end_time.substring(2,2)))
            shopInfo.status = 2;


        if(shopInfo.status != 3) {
            // 금일 근무자
            let workers = [];

            const scheduledData = await schedule.findAll({
                attributes: ['worker_id'],
                where: {shop_id: shopData.id, year: yearNow, month: monthNow, day: dateNow}
            });

            for (const sdata of scheduledData) {
                let workerData = await worker.findOne({
                    attributes: [['position_title', 'title'], ['user_first_name', 'firstName']],
                    where: {id: sdata.worker_id}
                });
                workerData.dataValues.title = workerData.dataValues.title.substring(2);
                workers.push(workerData);
            }
            totalData.workerInfo = workers;


            // 업무
            const coTaskTotalCountQeury = `select *
                                       from task 
                                       where (1 = 1)
                                       and status = 1
                                       and shop_id = ${shopData.id}
                                       and date_format(register_date,'%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d')`;
            const coTaskTotalCount = await task.sequelize.query(coTaskTotalCountQeury, {type: sequelize.QueryTypes.SELECT});

            const coTaskCompleteCountQeury = `select *
                                          from task 
                                          where (1 = 1)
                                          and status = 1
                                          and shop_id = ${shopData.id}
                                          and completer_job is not null
                                          and date_format(register_date,'%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d')`;
            const coTaskCompleteCount = await task.sequelize.query(coTaskCompleteCountQeury, {type: sequelize.QueryTypes.SELECT});
            const coTask = {
                completeCount: coTaskCompleteCount.length,
                totalCount: coTaskTotalCount.length
            };

            const taskTotalCountQuery = `select *
                                     from task 
                                     where (1 = 1)
                                     and status = 2
                                     and shop_id = ${shopData.id}
                                     and date_format(register_date,'%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d')`;
            const taskTotalCount = await task.sequelize.query(taskTotalCountQuery, {type: sequelize.QueryTypes.SELECT});

            const taskCompleteCountQuery = `select *
                                        from task 
                                        where (1 = 1)
                                        and status = 2
                                        and shop_id = ${shopData.id}
                                        and completer_job is not null
                                        and date_format(register_date,'%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d')`;

            const taskCompleteCount = await task.sequelize.query(taskCompleteCountQuery, {type: sequelize.QueryTypes.SELECT});
            const perTask = {
                completeCount: taskCompleteCount.length,
                totalCount: taskTotalCount.length
            };

            const taskInfo = {
                coTask: coTask,
                perTask: perTask
            };
            totalData.taskInfo = taskInfo;

        }

        // 소통창
        const boardData = await board.findAll({
            limit: 4,
            attributes: ['status', 'id', 'title'],
            where: {shop_id: shopData.id},
            order: [['register_date', 'DESC']]
        });
        totalData.boardInfo = boardData;

        console.log("success to get manager home page");
        res.json({
            code: "200",
            message: "관리자 홈화면 조회를 성공했습니다.",
            data: totalData
        });
        return;
    }
    catch(err) {
        console.log("get manager home page error", err);
        res.json({
            code: "400",
            message: "관리자 홈화면 조회에 오류가 발생했습니다."
        });
        return;
    }

});

// 근무자 홈
router.get('/worker', userUtil.LoggedIn, async (req,res)=> {
    try {
        let totalData = {};

        // 오늘 날짜
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth()+1;
        const dateNow = now.getDate();
        const dayNow = now.getDay();
        const hourNow = String(now.getHours()).padStart(2, '0');
        const minNow = String(now.getMinutes()).padStart(2, '0');

        const todayInfo = {
            month: monthNow,
            date: dateNow,
            day: weekdays[dayNow]
        }
        totalData.todayInfo = todayInfo;

        // 매장명
        const workerData = await worker.findOne({
            attributes: ['id', 'position_id', 'shop_name', 'position_title'],
            where: {id: req.job.substring(1)}
        });

        const positionData = await position.findOne({ where:{id: workerData.position_id }});
        let shopInfo = {
            status: 3, // 0 : 근무 전, 1: 근무 중, 2: 근무 후, 3: 휴무
            shopName: workerData.shop_name
        };

        let scheduledData;
        try {
            // 근무정보
            scheduledData = await schedule.findOne({
                attributes: ['start_time', 'end_time', 'real_start_time', 'real_end_time', 'shop_id'],
                where: {worker_id: workerData.id, year: yearNow, month: monthNow, day: dateNow}
            });
            console.log("success to get today position schedule info");

        } catch (err) {
            console.log("no today position schedule ", err);
        }
        totalData.shopInfo = shopInfo;

        if (scheduledData) {

            totalData.shopInfo.status = 0;

            if((hourNow > scheduledData.start_time.substring(0,2))
                || (hourNow == scheduledData.start_time.substring(0,2) && minNow > scheduledData.start_time.substring(2,2)))
                totalData.shopInfo.status = 1;

            if((hourNow > scheduledData.end_time.substring(0,2))
                || (hourNow == scheduledData.end_time.substring(0,2) && minNow > scheduledData.end_time.substring(2,2)))
                totalData.shopInfo.status = 2;


            const scheduleInfo = {
                positionTitle: workerData.position_title.substring(0, 2) + " " + workerData.position_title.substring(2),
                startTime: scheduledData.start_time,
                endTime: scheduledData.end_time,
                realStartTime: scheduledData.real_start_time,
                realEndTime: scheduledData.real_end_time,
                remainTime: timeUtil.subtract(hourNow + minNow, scheduledData.end_time)
            };
            totalData.scheduleInfo = scheduleInfo;


            // 업무
            const coTaskTotalCountQeury = `select *
                                            from task 
                                            where (1 = 1)
                                            and status = 1
                                            and shop_id = ${scheduledData.shop_id}
                                            and date_format(register_date,'%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d')`;
            const coTaskTotalCount = await task.sequelize.query(coTaskTotalCountQeury, {type: sequelize.QueryTypes.SELECT});

            const coTaskCompleteCountQeury = `select *
                                              from task 
                                              where (1 = 1)
                                              and status = 1
                                              and shop_id = ${scheduledData.shop_id}
                                              and completer_job is not null
                                              and date_format(register_date,'%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d')`;
            const coTaskCompleteCount = await task.sequelize.query(coTaskCompleteCountQeury, {type: sequelize.QueryTypes.SELECT});
            const coTask = {
                completeCount: coTaskCompleteCount.length,
                totalCount: coTaskTotalCount.length
            };

            const perTaskTotalCountQeury = `select *
                                            from task 
                                            where (1 = 1)
                                            and target_id = ${workerData.id}
                                            and status = 2
                                            and shop_id = ${scheduledData.shop_id}
                                            and date_format(register_date,'%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d')`;
            const perTaskTotalCount = await task.sequelize.query(perTaskTotalCountQeury, {type: sequelize.QueryTypes.SELECT});

            const perTaskCompleteQeury = `select *
                                            from task 
                                            where (1 = 1)
                                            and target_id = ${workerData.id}
                                            and status = 2
                                            and shop_id = ${scheduledData.shop_id}
                                            and completer_job is not null
                                            and date_format(register_date,'%Y-%m-%d') = DATE_FORMAT(now(), '%Y-%m-%d')`;
            const perTaskCompleteCount = await task.sequelize.query(perTaskCompleteQeury, {type: sequelize.QueryTypes.SELECT});

            const perTask = {
                completeCount: perTaskCompleteCount.length,
                totalCount: perTaskTotalCount.length
            };

            const taskInfo = {
                coTask: coTask,
                perTask: perTask
            };
            totalData.taskInfo = taskInfo;

        }

            // 소통창
            const boardData = await board.findAll({
                limit: 4,
                attributes: ['status', 'id', 'title'],
                where: {shop_id: positionData.shop_id},
                order: [['register_date', 'DESC']]
            });

            // 공지사항의 경우, 확인유뮤
            let boardInfo = [];
            for (const bdata of boardData) {
                if (bdata.status == 0) {
                    let confirmCount = await comment.count({
                        where: {
                            board_id: bdata.id,
                            status: 0,
                            writer_job: req.job
                        }
                    });
                    if (confirmCount > 0)
                        bdata.confirm = 1;
                    else bdata.confirm = 0;
                }
                boardInfo.push(bdata);
            }
            totalData.boardInfo = boardInfo;


        console.log("success to get worker home page");
        res.json({
            code: "200",
            message: "근무자 홈화면 조회를 성공했습니다.",
            data: totalData
        });
        return;
    }
    catch(err) {
        console.log("get worker home page error", err);
        res.json({
            code: "400",
            message: "근무자 홈화면 조회에 오류가 발생했습니다."
        });
        return;
    }

});


module.exports = router;
