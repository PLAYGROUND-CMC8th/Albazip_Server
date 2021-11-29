var sequelize = require('sequelize');
var op = sequelize.Op;
var voca = require('voca');


const { position, task, user, manager, worker, schedule } = require('../models');

module.exports = {
    // 지각횟수
    getLateCount: async (positionId, registerDate) => {

        let workerData;
        try {
            workerData = await worker.findOne({ where : {position_id: positionId} });
        } catch(err) {
            workerData = null;
        }

        try {
            const lateCountQuery = `select *
                                    from schedule
                                    where worker_id = ${workerData.id}
                                    and date(update_date) between "${workerData.register_date}" and now()
                                    and real_start_time is not null 
                                    and real_start_time > start_time`;

            const lateCount = await schedule.sequelize.query( lateCountQuery, { type: sequelize.QueryTypes.SELECT });
            console.log("success to get worker late count");
            return {
                code: "200",
                message: "근무자 지각횟수 조회에 성공했습니다.",
                data: lateCount.length
            };


        } catch (err) {
            console.log("get worker late count error", err);
            return {
                code: "400",
                message: "근무자 지각횟수 조회에 오류가 발생했습니다.",
                data: null
            };
        }
    },

    // 공동업무 참여횟수
    getCoTaskCount: async (positionId, registerDate) => {

        let workerData;
        try {
            workerData = await worker.findOne({ where : {position_id: positionId} });
        } catch(err) {
            workerData = null;
        }

        try {
            const query = `select *
                           from task 
                           where (1 = 1)
                           and	status = 1
                           and  completer_job = "W${workerData.id}"
                           and	date(update_date) between "${workerData.register_date}" and now()`;


            const coTaskCount = await task.sequelize.query( query, { type: sequelize.QueryTypes.SELECT });

            console.log("success to get worker cooperate task count");
            return {
                code: "200",
                message: "근무자 공동업무 참여횟수 조회에 성공했습니다.",
                data: coTaskCount.length
            };

        } catch (err) {
            console.log("get worker cooperate task count", err);
            return {
                code: "200",
                message: "근무자 공동업무 참여횟수 조회에 오류가 발생했습니다.",
                data: null
            };
        }
    },

    // 업무완수율
    getTaskRate: async (positionId, registerDate) => {

        let workerData;
        try {
            workerData = await worker.findOne({ where : {position_id: positionId} });
        } catch(err) {
            workerData = null;
        }

        try {

            const completeTaskCountQuery = `select *
                           from task
                           where (1 = 1)
                           and	status = 2
                           and target_id = ${workerData.id}
                           and completer_job = "W${workerData.id}"
                           and date(update_date) between "${registerDate}" and now()`;


            const completeTaskCount = await task.sequelize.query( completeTaskCountQuery, { type: sequelize.QueryTypes.SELECT });

            const totalTaskCountQuery = `select *
                           from task
                           where (1 = 1)
                           and	status = 2
                           and target_id = ${workerData.id}
                           and date(update_date) between "${workerData.register_date}" and now()`;


            const totalTaskCount = await task.sequelize.query( totalTaskCountQuery, { type: sequelize.QueryTypes.SELECT });

            console.log("success to get worker complete task rate");
            return {
                code: "200",
                message: "근무자 업무완수율 조회에 성공했습니다.",
                data: {
                    completeTaskCount: completeTaskCount.length,
                    totalTaskCount: totalTaskCount.length,
                }
            };

        } catch (err) {

            console.log("get worker complete task rate error", err);
            return {
                code: "400",
                message: "근무자 업무완수율 조회에 오류가 발생했습니다.",
                data: {
                    completeTaskCount: null,
                    totalTaskCount: null
                }
            };

        }
    }

};