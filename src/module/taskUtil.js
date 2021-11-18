var sequelize = require('sequelize');
var op = sequelize.Op;
var fn = sequelize.fn;

var workerUtil = require('../module/workerUtil');

const { schedule, time, position, task, shop, manager, worker } = require("../models");


module.exports ={
    // 업무 생성 스케줄러
    makeAllTask: async() => {
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth()+1;
        const dateNow = now.getDate();

        await schedule.findAll({
            attributes: ['worker_id'],
            where: {
                year: yearNow,
                month: monthNow,
                day: dateNow
            }
        })
            .then(async (scheduleData) => {

                for(const sdata of scheduleData) {
                    let workerData = await worker.findOne({where: {id: sdata.worker_id}});
                    let taskData = await task.findAll({where: {status: 0, target_id: workerData.position_id}});

                    for (let tdata of taskData) {
                        tdata.dataValues.id = null;
                        tdata.dataValues.status = 2;
                        tdata.dataValues.target_id = workerData.id;
                        tdata.dataValues.register_date = new Date();
                        task.create(tdata.dataValues);
                    }
                }
            })
            .catch((err) => {
                console.log("make todays task error", err);
                return;
            })
        console.log("make todays task success");
        return;
    },

    // 마이페이지 > 하단 > 근무자 > 하단 > 업무 리스트
    getPositionTaskList: async (positionId) => {
        try {

            let taskData;
            try {
                taskData = await task.findAll({
                    attributes: ['id', ['writer_job', 'writerTitle'], 'title', 'content', ['register_date', 'registerDate']],
                    where: {
                        status: 0,
                        target_id: positionId
                    }
                });
                console.log("success to get position task data");
            } catch {
                console.log("get position task data error", err);
                return {
                    code: "400",
                    message: "근무자의 업무 조회에 오류가 발생했습니다."
                };
            }

            if (taskData) {
                try {
                    for (let tdata of taskData) {

                        let jobData;
                        if (tdata.dataValues.writerTitle[0] == 'M') {
                            jobData = await manager.findOne({where: {id: tdata.dataValues.writerTitle.substring(1)}});
                            tdata.dataValues.writerName = jobData.user_last_name + jobData.user_first_name;
                            tdata.dataValues.writerTitle = "사장님";
                        } else if (tdata.dataValues.writerTitle[0] == 'W') {
                            jobData = await worker.findOne({where: {id: tdata.dataValues.writerTitle.substring(1)}});
                            tdata.dataValues.writerName = jobData.user_first_name;
                            tdata.dataValues.writerTitle = jobData.position_title;
                        }
                    }
                    console.log("success to get task writer");
                } catch (err) {
                    console.log("get task writer error", err);
                }
            }
            console.log("success to get position task list");
            return {
                code: "200",
                message: "근무자의 업무리스트 조회를 성공했습니다.",
                data: taskData
            };

        }
        catch(err) {
            console.log("get position task list error", err);
            return {
                code: "400",
                message: "근무자의 업무리스트 조회에 오류가 발생했습니다."
            };
        }
    },

    // 근무자: 마이페이지 > 내정보 > 공동업무
    // 관리자: 마이페이지 > 근무자 > 근무자 정보 > 공동업무
    getCotaskInfo: async(positionId) => {

        let workerData;
        try {
            workerData = await worker.findOne({ where : {position_id: positionId} });
        } catch(err) {
            workerData = null;
        }

        const query = `select title, content, 
                              substr(register_date, 1, 4) as year, substr(register_date, 6, 2) as month, substr(register_date, 9, 2) as date, 
                              update_date as complete_date
                       from task 
                       where (1 = 1)
                       and	status = 1
                       and  completer_job = "W${workerData.id}"
                       and	date(register_date) between "${workerData.register_date}" and now()
                       order by year desc, month desc, date desc;`;

        try {
            const coTaskData = await task.sequelize.query( query, { type: sequelize.QueryTypes.SELECT });


            console.log("success to get worker coTask");
            return {
                code: "200",
                message: "근무자의 공동업무 조회에 성공했습니다.",
                data: coTaskData
            };
        }
        catch(err) {
            console.log("get worker ccoTask error", err);
            return {
                code: "400",
                message: "근무자의 공동업무 조회에 오류가 발생했습니다."
            };
        }

    },

    // 근무자: 마이페이지 > 내정보 > 완료한업무 > 전체조회
    // 관리자: 마이페이지 > 근무자 > 근무자 정보 > 완료한업무 > 전체조회
    getCompleteTaskTotal: async(positionId) => {

        let completeTaskResult = {};

        let workerData;
        try {
            workerData = await worker.findOne({ where : {position_id: positionId} });
        } catch(err) {
            workerData = null;
        }

        completeTaskResult.taskRate = {};
        const completeTaskInfo = await workerUtil.getTaskRate(positionId, workerData.register_date);
        completeTaskResult.taskRate = completeTaskInfo.data;

        const query = `select	tmp.year, tmp.month,
                                count(*) as totalCount,
                                count(completer_job) as completeCount
                        from(	select completer_job, register_date, substr(register_date, 1, 4) as year, substr(register_date, 6, 2) as month
                                from task
                                where (1 = 1)
                                and	status = 2
                                and target_id = ${workerData.id}
                                and date(register_date) between "${workerData.register_date}" and now()
                        ) tmp
                        group by tmp.year, tmp.month
                        order by tmp.year desc, tmp.month desc`;

        try {
            const taskData = await task.sequelize.query( query, { type: sequelize.QueryTypes.SELECT });
            completeTaskResult.taskData = taskData;

            console.log("success to get worker complete task");
            return {
                code: "200",
                message: "근무자의 완수업무율 전체 조회에 성공했습니다.",
                data: completeTaskResult
            };
        }
        catch(err) {
            console.log("get worker complete task error", err);
            return {
                code: "400",
                message: "근무자의 완수업무율 전체 조회에 오류가 발생했습니다."
            };
        }

    },

    // 근무자: 마이페이지 > 내정보 > 완료한업무 > 월별조회
    // 관리자: 마이페이지 > 근무자 > 근무자 정보 > 완료한업무 > 월별조회
    getCompleteTaskMonth: async(positionId, year, month) => {

        let workerData;
        try {
            workerData = await worker.findOne({ where : {position_id: positionId} });
        } catch(err) {
            workerData = null;
        }

        const query = `select	tmp.month, tmp.day, 
                                CASE dayofweek(tmp.register_date)
                                    WHEN '1' THEN '일요일'
                                    WHEN '2' THEN '월요일'
                                    WHEN '3' THEN '화요일'
                                    WHEN '4' THEN '수요일'
                                    WHEN '5' THEN '목요일'
                                    WHEN '6' THEN '금요일'
                                    WHEN '7' THEN '토요일'
                                END AS week_day,
                                count(*) as totalCount,
                                count(completer_job) as completeCount
                        from(	select completer_job, register_date, substr(register_date, 6, 2) as month, substr(register_date, 9, 2) as day
                                from task
                                where (1 = 1)
                                and	status = 2
                                and target_id = ${workerData.id}
                                and year(register_date)= "${year}" and month(register_date) = "${month}"
                                and date(register_date) between "${workerData.register_date}" and now()
                        ) tmp
                        group by tmp.month, tmp.day
                        order by tmp.month desc, tmp.day desc`;

        try {
            const taskData = await task.sequelize.query( query, { type: sequelize.QueryTypes.SELECT });

            console.log("success to get worker month complete task");
            return {
                code: "200",
                message: `근무자의 ${year}년 ${month}월 완료한업무 조회를 성공했습니다.`,
                data: taskData
            };
        }
        catch(err) {
            console.log("get worker month complete task error", err);
            return {
                code: "400",
                message: `근무자의 ${year}년 ${month}월 완료한업무 조회에 오류가 발생했습니다.`
            };
        }
    },

    // 근무자: 마이페이지 > 내정보 > 완료한업무 > 일별조회
    // 관리자: 마이페이지 > 근무자 > 근무자 정보 > 완료한업무 > 일별조회
    getCompleteTaskDate: async(positionId, year, month, date) => {

        let workerData;
        try {
            workerData = await worker.findOne({ where : {position_id: positionId} });
        } catch(err) {
            workerData = null;
        }

        const cQuery = `select	title, content, update_date as complete_date
                        from    task
                        where   status = 2
                        and     target_id = ${workerData.id}
                        and     completer_job is not null
                        and     year(register_date) = "${year}"
                        and     month(register_date) = "${month}"
                        and     day(register_date) = "${date}"
                        and     date(register_date) between "${workerData.register_date}" and now()`;

        const nQuery = `select tmp.title, tmp.content,
                               if(substr(tmp.writer_job, 1, 1) = 'S',
                                 (select concat(user_last_name, user_first_name) from manager where id = substr(tmp.writer_job, 2)),
                                 (select user_first_name from worker where id = substr(tmp.writer_job, 2))) as writer_name,
                               if(substr(tmp.writer_job, 1, 1) = 'S',"사장님",
                                 (select position_title from worker where id = substr(tmp.writer_job, 2))) as writer_position,        
                               tmp.register_date
                        from(  select title, content, register_date, writer_job
                               from    task
                               where   status = 2
                               and     target_id = ${workerData.id}
                               and     completer_job is null
                               and     year(register_date) = "${year}"
                               and     month(register_date) = "${month}"
                               and     day(register_date) = "${date}"
                               and     date(register_date) between "${workerData.register_date}" and now()
                            )  tmp;`

        try {
            const completeTaskData = await task.sequelize.query( cQuery, { type: sequelize.QueryTypes.SELECT });
            const nonCompleteTaskData = await task.sequelize.query( nQuery, { type: sequelize.QueryTypes.SELECT });

            console.log("success to get worker date complete task");
            return {
                code: "200",
                message: `근무자의 ${year}년 ${month}월 ${date}일 완료한업무 조회에 성공했습니다.`,
                data: {
                    nonCompleteTaskData,
                    completeTaskData
                }
            };
        }
        catch(err) {
            console.log("get worker date complete task error", err);
            return {
                code: "400",
                message:  `근무자의 ${year}년 ${month}월 ${date}일 완료한업무 조회에 오류가 발생했습니다.`,
            };
        }

    }

};