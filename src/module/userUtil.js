var jwt = require('../module/jwt');
const { user, worker, manager, time, schedule, shop, position } = require('../models');

module.exports = {
    // 휴대폰 중복여부
    checkPhoneExistance: async (phone) => {
        return await user.count({
            where: {
                phone: phone,
                status: [1,2]
            }
        })
            .then(count => {
                return count !== 0;
            });
    },

    // 로그인 유효성 검사
    LoggedIn: (req, res, next) => {
        const token = req.headers.token;

        if (!token) {
            res.json({
                code: "202",
                message: "로그인 토큰이 존재하지 않습니다."
            })
        } else {
            let result = jwt.verify(token);
            /*if(result == -1){

                result = jwt.verify(findToken.searchRefreshToken(refreshToken));
                console.log("토큰을 재발행했습니다.:", result);
            }*/
            if (result == -1) {
                return res.json({
                    code: "202",
                    message: "보유한 토큰이 만료되었습니다."
                })
            }
            if (result == -2) {
                return res.json({
                    code: "202",
                    message: "유효하지 않은 토큰입니다."
                })
            }
            if (result == -3) {
                return res.json({
                    code: "202",
                    message: "보유한 토큰이 올바르지 않습니다."
                })
            }
            const userId = result.id;
            if (!userId) {
                console.log(result.id, result.job);
                return res.json({
                    code: "400",
                    message:"토큰 인증에 오류가 발생했습니다."
                })
            } else {
                console.log("success check logged in");
                req.id = result.id;
                req.job = result.job;
                next()
            }
        }

    },

    // 근무자 삭제
    deleteWorker: async (workerId) => {

        try {
            // 1. worker 삭제
            try {
                await worker.destroy({where: {id: workerId}});
                console.log("success to delete worker data ");
            } catch (err) {
                console.log("delete worker data error", err);
                return {
                    code: "400",
                    message: "근무자 정보 삭제에 오류가 발생했습니다."
                };
            }

            // 2. worker의 앞으로의 스케줄 삭제
            // 오늘의 날짜
            const now = new Date();
            const yearNow = now.getFullYear();
            const monthNow = now.getMonth()+1;
            const dateNow = now.getDate();

            const query = ` delete
                    from schedule
                    where worker_id = ${workerId}
                    and ((year+0 > ${yearNow})
                    or (year+0 = ${yearNow} and month+0 > ${monthNow})
                    or (year+0 = ${yearNow} and month+0 = ${monthNow} and day+0 > ${dateNow}))`;

            try {
                await schedule.sequelize.query(query);
                console.log("success to delete schedule");
            } catch (err) {
                console.log("delete schedule error", err);
                return {
                    code: "400",
                    message: "근무자의 스케줄 삭제에 오류가 발생했습니다."
                };
            }

            console.log("success to resign worker");
            return {
                code: "200",
                message: "근무자 퇴사를 성공했습니다."
            };
        }
        catch(err) {
            console.log("resign worker error", err);
            return {
                code: "400",
                message: "근무자 퇴사에 오류가 발생했습니다."
            };
        }
    },

    // 관리자 삭제
    deleteManager: async (managerId) => {

        try {
            const managerData = await manager.findOne({attributes: ['shop_id'], where: {id: managerId}});
            const shopId = managerData.shop_id;

            // 1. manager 삭제
            /* try {
                 await manager.destroy({where: {id: managerId}});
                 console.log("success to delete manager data ");
             } catch (err) {
                 console.log("delete manager data error", err);
                 return {
                     code: "400",
                     message: "관리자 정보 삭제에 오류가 발생했습니다."
                 };
             }*/

            // 2. shop의 time 삭제
            try {
                await time.destroy({where: {status: 0, target_id: shopId}});
                console.log("success to delete shop's time data ");
            } catch (err) {
                console.log("delete shop's time data error", err);
                return {
                    code: "400",
                    message: "매장 영업시간 삭제에 오류가 발생했습니다."
                };
            }

            // 3. shop의 position의 time 삭제
            try {
                const positionData = await position.findAll({where: {shop_id: shopId}});
                for (const pdata of positionData) {
                    await time.destroy({where: {status: 1, target_id: pdata.id}});
                }
                console.log("success to delete shop postion's time data ");
            } catch (err) {
                console.log("delete shop postion's time data error", err);
                return {
                    code: "400",
                    message: "매장 포지션 근무시간 삭제에 오류가 발생했습니다."
                };
            }

            // 4. shop 삭제
            try {
                await shop.destroy({where: {id: shopId}});
                console.log("success to delete shop data ");
            } catch (err) {
                console.log("delete shop data error", err);
                return {
                    code: "400",
                    message: "매장 삭제에 오류가 발생했습니다."
                };
            }

            console.log("success to delete manager data");
            return {
                code: "200",
                message: "관리자 삭제를 성공했습니다."
            };

        }
        catch(err) {
            console.log("delete manager data error", err);
            return {
                code: "400",
                message: "관리자 삭제에 오류가 발생했습니다."
            };

        }


    }
};