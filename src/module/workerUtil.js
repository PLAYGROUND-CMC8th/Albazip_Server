var sequelize = require('sequelize');
var op = sequelize.Op;
var voca = require('voca');


const { position, task, user, manager, worker, schedule } = require('../models');

module.exports = {

    // 지각횟수
    getLateCount: async (positionId, registerDate) => {

        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth();
        const dateNow = now.getDate();

        try {
            const lateCount = await schedule.count({
                where: {
                    position_id: positionId,
                    register_date: {[op.gte]: registerDate},
                    year: {[op.lte]: yearNow}, month: {[op.lte]: monthNow}, day: {[op.lt]: dateNow},
                    real_start_time: {[op.ne]: null}, real_start_time: {[op.gt]: 'start_time'}
                }
            });
            console.log("success to get worker late count");
            return {
                code: "200",
                message: "근무자 지각횟수 조회에 성공했습니다.",
                data: lateCount
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

        try {
            const coTaskCount = await task.count({
                where: {
                    target_date: {[op.gte]: registerDate},
                    status: 1, completer_job: "P" + positionId
                }
            });
            console.log("success to get worker cooperate task count");
            return {
                code: "200",
                message: "근무자 공동업무 참여횟수 조회에 성공했습니다.",
                data: coTaskCount
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

        try {
            const completeTaskCount = await task.count({
                where: {
                    register_date: {[op.between]: [registerDate, new Date()]},
                    status: 2, target_id: positionId, completer_job: {[op.ne]: null}
                }
            });

            const totalTaskCount = await task.count({
                where: {
                    register_date: {[op.between]: [registerDate, new Date()]},
                    status: 2, target_id: positionId
                }
            });

            console.log("success to get worker complete task rate");
            return {
                code: "200",
                message: "근무자 업무완수율 조회에 성공했습니다.",
                data: {
                    completeTaskCount: completeTaskCount,
                    totalTaskCount: totalTaskCount,
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