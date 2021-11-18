const admin = require('firebase-admin')
let serviceAccount = require('../config/albazip-cd574-firebase-adminsdk-bbzyx-ebe9929709.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = {
    // 푸시알람 테스트 카이트
    testKite : async (req, res, next) => {

        let target_token_array = ["evJXnjz_R9qmrlzWK6ZG-g:APA91bE43OlFENm9BQJ3wISUYEHWUUZmSMjmUcP6H5dsJDYwVVBE6zGh2r6vZrPF2zHmYbsKBHtr-AvDUZuaMHMwzocvSQAUnSsflZTeNe485XsjKm5VLVfSOjqwzdmBg32aknkt3p8E"];

        if (!target_token_array) {
            console.log("no target token: ", target_token);
            res.json({
                code: "202",
                message: "등록된 기기의 토큰이 유효하지 않습니다. "
            })
        } else {

            let message = {
                notification: {
                    title: "카이트 푸시알림 테스트",
                    body: "카이트 푸시알림 테스트 중입니다 ~"
                },
                data: {
                    flag: "0",
                    status: "2",
                    name: "카이트",
                    job: "Android Developer"
                }
            };

            admin.messaging().sendToDevice(target_token_array, message)
                .then((response) => {
                    console.log("push alarm success: ", response)
                    return res.json({
                        code: "200",
                        message:"푸시알림 발송을 성공했습니다."
                    });
                })
                .catch((error) => {
                    console.log("error push alarm server: ", error)
                    return res.json({
                        code: "400",
                        message:"푸시알림 발송에 오류가 발생했습니다."
                    });
                })
            next();
        }
    },

    // 푸시알람 테스트 초비
    testChobi : async (req, res, next) => {

        let target_token_array = ["dRxMLg1G2U0tijL38ZnZ2h:APA91bHB3t6hT2207-rf1RkerUOFArdJgvCKJN0pltLI-j1XMHCPpW2idr6KfLseipd8tli-BUAwrqPNuG8i43x4Ct06L_g45hwWde6aMqBpmB5P2Cs6hLd5yOTRI5CyfjgaqNSwIak5"];

        if (!target_token_array) {
            console.log("no target token: ", target_token);
            res.json({
                code: "202",
                message: "등록된 기기의 토큰이 유효하지 않습니다. "
            })
        } else {

            let message = {
                notification: {
                    title: "초비 푸시알림 테스트",
                    body: "초비 푸시알림 테스트 중입니다 ~"
                },
                data: {
                    flag: "0",
                    status: "2",
                    name: "초비",
                    job: "iOS Developer"
                }
            };


            admin.messaging().sendToDevice(target_token_array, message)
                .then((response) => {
                    console.log("push alarm success: ", response)
                    return res.json({
                        code: "200",
                        message:"푸시알림 발송을 성공했습니다."
                    });
                })
                .catch((error) => {
                    console.log("error push alarm server: ", error)
                    return res.json({
                        code: "400",
                        message:"푸시알림 발송에 오류가 발생했습니다."
                    });
                })
            next();
        }
    }
};