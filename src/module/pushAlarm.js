const admin = require('firebase-admin')
let serAccount = require('../config/albazip-5978d-firebase-adminsdk-dpw0u-4e17510d76.json')

module.exports = {
    checkPhone : async (req, res, next) => {
        let target_token =req.headers.registerToken;
        if (!target_token) {
            res.status(200).json({
                message: "등록된 기기의 토큰이 유효하지 않습니다. "
            })
        } else {
            let message = {
                data: {
                    title: '테스트 데이터 발송',
                    body: '데이터 바디'
                },
                token: target_token
            };

            admin.initializeApp({
                credential: admin.credential.cert(serAccount),
            });

            admin
                .messaging()
                .send(message)
                .then(function (response) {
                    console.log("Successfully sent message: ", response)
                })
                .catch(function (err) {
                    console.log("Error Sending message: ", err)
                    return response.status(200).json({
                        message:"휴대폰인증번호 푸시알림 발송을 실패했습니다."
                    });
                });
            next();
        }
    }
};