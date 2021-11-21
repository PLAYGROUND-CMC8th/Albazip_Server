var sequelize = require('sequelize');
var op = sequelize.Op;
var voca = require('voca');

var workerUtil = require('../module/workerUtil');

const { position, task, user, manager, worker, schedule } = require('../models');

module.exports = {

    // 포지션 랜덤코드 생성
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

    // 관리자: 마이페이지 > 하단 > 근무자 리스트
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
                            image_path: workerData == null ? null : workerData.image_path,
                            title: pdata.title,
                            first_name: workerData == null ? "" : workerData.user_first_name
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

        let workerProfileData = {};
        try {
             const positionData = await position.findOne({
                attributes: ['rank', 'title'],
                where: {id: positionId}});

            workerProfileData.rank = positionData.rank;
            workerProfileData.title = positionData.title;
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
            workerProfileData.imagePath = workerData.image_path;
            workerProfileData.firstName = workerData.user_first_name;

        }
        catch(err) {
            console.log("get worker data error or no worker exist", err);
            workerProfileData.imagePath = null;
            workerProfileData.dataValues.firstName = "";
        }

        return {
            code: "200",
            message: "근무자 프로필 조회를 성공했습니다!",
            data: workerProfileData
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

                workerInfo.workInfo = {};
                // 지각횟수
                const lateCountResult = await workerUtil.getLateCount(positionId, workerData.register_date);
                workerInfo.workInfo.lateCount = lateCountResult.data;


                //공동업무 참여횟수
                const coTaskCountResult  = await workerUtil.getCoTaskCount(positionId, workerData.register_date);
                workerInfo.workInfo.coTaskCount = coTaskCountResult.data;

                // 업무완수율
                const taskRateResult = await workerUtil.getTaskRate(positionId, workerData.register_date);
                workerInfo.workInfo.completeTaskCount = taskRateResult.data.completeTaskCount;
                workerInfo.workInfo.totalTaskCount = taskRateResult.data.totalTaskCount;

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
                            ['work_day', 'workDay'],
                            ['salary_type', 'salaryType'], 'salary'],
                where: {id: positionId}});

            console.log("success to get position data");
            positionData.dataValues.workDay = voca.replaceAll(positionData.dataValues.workDay, ',', ' ');

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
    },

    // 포지션 삭제

};