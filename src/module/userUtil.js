var jwt = require('../module/jwt');
const { user } = require('../models');

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

    }
};