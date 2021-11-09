var sequelize = require('sequelize');
var op = sequelize.Op;


const { position, task, user, manager, worker, schedule } = require('../models');

module.exports = {

    makeRandomCode: async ()=> {
        const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;

        let randomCode = '';
        while(1) {
            randomCode = '';
            for (let i = 0; i < 10; i++) {
                randomCode += characters.charAt(Math.floor(Math.random() * charactersLength));
            }

            let count = await position.count({where: {code: randomCode} });
            if(count == 0) break;
        }

        return randomCode;
    },

    // 관리자: 마이페이지 > 하단 > 근무자
    getWorkersList : async(shopId) => {

        try {
            let positionData;
            try {
                positionData = await position.findAll({where: {shop_id: shopId}});
                console.log("success to get shop positions");
            } catch {
                console.log("get shop positions error", err);
                return {
                    code: "400",
                    message: "포지션 정보 조회에 오류가 발생했습니다."
                };
            }

            let positionInfo = [];
            try {
                if (positionData) {
                    for (const pdata of positionData) {

                        let workerData;
                        try {
                            workerData = await worker.findOne({where: {position_id: pdata.id}});
                        } catch {
                            workerData = null;
                        }

                        let data = {
                            positionId: pdata.id,
                            status: workerData == null ? 0 : workerData.status,
                            rank: pdata.rank,
                            image_path: pdata.image_path,
                            title: pdata.title,
                            first_name: workerData == null ? "근무자 없음" : workerData.user_first_name
                        }
                        positionInfo.push(data);
                    }
                    console.log("success to get mypage workers data");
                }
            } catch (err) {
                console.log("get mypage workers data error", err);
                return {
                    code: "400",
                    message: "근무자 정보 조회에 오류가 발생했습니다.",
                };
            }
            console.log("success get mypage worker list");
            return {
                code: "200",
                message: "근무자 리스트 조회에 성공했습니다.",
                data: positionInfo
            };
        }
        catch(err) {
            console.log("get mypage worker list error", err);
            return {
                code: "400",
                message: "근무자 리스트 조회에 오류가 발생했습니다."
            };
        }

    },

    // 관리자: 마이페이지 > 하단 > 근무자 > 상단 > 근무자 프로필
    getPositionProfile: async (positionId) => {

        let positionProfileData;
        try {
            positionProfileData = await position.findOne({
                attributes: ['rank', 'title', ['image_path', 'imagePath']],
                where: {id: positionId}});
            console.log("success to get position data");
        }
        catch(err) {
            console.log("get position data error", err);
            return {
                code: "400",
                message: "근무자 프로필 조회에 오류가 발생했습니다."
            };
        }

        try {
            const workerData = await worker.findOne({where: {position_id: positionId}});
            console.log("success to get worker data");
            positionProfileData.dataValues.firstName = workerData.user_first_name;

        }
        catch(err) {
            console.log("get worker data error or no worker exist", err);
            positionProfileData.dataValues.firstName = "근무자 없음";
        }

        return {
            code: "200",
            message: "근무자 프로필 조회를 성공했습니다!",
            data: positionProfileData
        };

    },

    // 관리자: 마이페이지 > 하단 > 근무자 > 하단 > 근무자 정보
    // 근무자: 마이페잊 > 하단 > 내정보
    getWorkerInfo: async(positionId) => {

        try {
            // 근무자 정보
            let workerData;
            try {
                workerData = await worker.findOne({where: {position_id: positionId}});
                console.log("success to get worker data");
            } catch {
                workerData = null;
            }

            let workerInfo = {};
            if (!workerData) {
                workerInfo.workerExist = 0;

                try {
                    // 포지션 코드
                    const positionInfo = await position.findOne({attributes: ['code'], where: {id: positionId}});
                    workerInfo.positionInfo = positionInfo;
                    console.log("success to get position code");
                } catch (err) {
                    workerInfo.positionInfo.code = null;
                    console.log("get position code error", err);
                }

            } else {
                workerInfo.workerExist = 1;

                try {
                    // 근무자 유저 정보
                    const userInfo = await user.findOne({
                        attributes: ["phone", "birthyear", "gender"],
                        where: {id: workerData.user_id}
                    });
                    workerInfo.userInfo = userInfo;
                    console.log("success to get user userData");
                } catch (err) {
                    workerInfo.userInfo = null;
                    console.log("get user userData error", err);
                }

                const now = new Date();
                const yearNow = now.getFullYear();
                const monthNow = now.getMonth();
                const dateNow = now.getDate();

                workerInfo.workInfo = {};
                try {
                    // 지각횟수
                    const lateCount = await schedule.count({
                        where: {
                            register_date: {[op.gte]: workerData.register_date},
                            year: {[op.lte]: yearNow}, month: {[op.lte]: monthNow}, day: {[op.lt]: dateNow},
                            real_start_time: {[op.ne]: null}, real_start_time: {[op.gt]: 'start_time'}
                        }
                    });
                    workerInfo.workInfo.lateCount = lateCount;
                    console.log("success to get worker late count");

                } catch (err) {
                    workerInfo.workInfo.lateCount = null;
                    console.log("get worker late count error", err);
                }

                try {
                    // 공동업무 참여횟수
                    const coTaskCount = await task.count({
                        where: {
                            target_date: {[op.gte]: workerData.register_date},
                            status: 1, completer_job: "P" + positionId
                        }
                    });
                    workerInfo.workInfo.coTaskCount = coTaskCount;
                    console.log("success to get worker cooperate task count");
                } catch (err) {
                    workerInfo.workInfo.coTaskCount = null;
                    console.log("get worker cooperate task count", err);
                }


                try {
                    // 업무완수율
                    const completeTaskCount = await task.count({
                        where: {
                            target_date: {[op.gte]: workerData.register_date},
                            status: 2, completer_job: "P" + positionId
                        }
                    });

                    const totalTaskCount = await task.count({
                        where: {
                            target_date: {[op.gte]: workerData.register_date},
                            status: 2, target_id: positionId
                        }
                    });

                    workerInfo.workInfo.completeTaskCount = completeTaskCount;
                    workerInfo.workInfo.totalTaskCount = totalTaskCount;
                    console.log("success to get worker complete task rate");
                } catch (err) {
                    workerInfo.workInfo.completeTaskCount = null;
                    workerInfo.workInfo.totalTaskCount = null;
                    console.log("get worker complete task rate error", err);
                }
                workerInfo.joinDate = workerData.register_date;
            }

            console.log("success to get worker info");
            return {
                code: "200",
                message: "근무자의 근무자 정보 조회를 성공했습니다.",
                data: workerInfo
            };
        }
        catch(err) {
            console.log("get worker info error", err);
            return {
                code: "400",
                message: "근무자의 근무자 정보 조회에 오류가 발생했습니다."
            };
        }
    },

    // 관리자: 마이페이지 > 하단 > 근무자 > 하단 > 포지션 정보
    // 근무자: 마이페이지 > 하단 > 포지션 정보
    getPositionInfo: async (positionId) => {

        try {
            const positionData = await position.findOne({
                attributes:[['start_time', 'startTime'], ['end_time', 'endTime'],
                            ['work_time', 'workTime'], ['break_time', 'breakTime'],
                            ['salary_type', 'salaryType'], 'salary'],
                where: {id: positionId}});
            console.log("success to get position data");

            return {
                code: "200",
                message: "근무자 포지션 조회를 성공했습니다.",
                data: positionData
            };

        }
        catch(err) {
            console.log("get position data error", err);
            return {
                code: "400",
                message: "근무자 포지션 조회에 오류가 발생했습니다."
            };
        }
    }

};