const admin = require('firebase-admin')
let serAccount = require('../config/albazip-5978d-firebase-adminsdk-dpw0u-4e17510d76.json')

module.exports = {
    checkPhone : async (req, res, next) => {
        let target_token = req.headers.registerToken;
        let title = req.body.title;
        let context = req.body.content;

        if (!target_token) {
            console.log("no target token: ", target_token);
            res.status(202).json({
                message: "등록된 기기의 토큰이 유효하지 않습니다. "
            })
        } else {
            let message = {
                data: {
                    title: title,
                    body: context
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
                    console.log("push alarm success: ", response)
                })
                .catch(function (err) {
                    console.log("error push alarm server: ", err)
                    return response.status(400).json({
                        message:"푸시알림 발송에 오류가 발생했습니다."
                    });
                });
            next();
        }
    }
};