var express = require('express');
var router = express.Router();

var jwt = require('../../../module/jwt');
var encryption = require('../../../module/encryption');

const { user, manager, worker, shop, position, task, board, schedule } = require('../../../models');

router.post('/',async (req,res)=>{

    const{ phone, pwd } = req.body;

    //1. 파라미터체크
    if(!phone || !pwd){
        console.log("not enough parameter");
        res.json({
            code: "202",
            message: "휴대폰번호와 비밀번호를 입력해주세요."
        });
        return;
    }

    //2.휴대폰번호 확인
    try{
        var userData = await user.findOne({ where: { phone: phone } });
        if(!userData){
            console.log("no such user");
            res.json({
                code: "202",
                message:"존재하지 않는 계정입니다."
            })
            return;
        }
    } catch(err){
        console.log("user server error");
        res.json({
            code: "400",
            message:"휴대폰번호 확인시 오류가 발생했습니다."
        })
        return;
    }

    //3.비밀번호 체크
    try{
        let userData = await user.findOne({ where: { phone: phone } });
        const encryptPwd = (encryption.makeCrypto(pwd, userData.salt)).toString('base64');
        if(encryptPwd == userData.pwd){
            const token = jwt.sign(userData);

            // last_access_data 업데이트
            await user.update({ latest_access_date: new Date()}, {where: {id: userData.id}})
                .then(() => {
                    console.log("user latest access date update success");
                })
                .catch((err) => {
                    console.log("user latest access date update error", err);
                });

            // 유저의 모든 정보 가져오기
            let shopData, positionData, taskData, boardData, scheduleData;

            if(!userData.last_job) {
                shopData = null;
                positionData = null;
                taskData = null;
                boardData = null;
                scheduleData = null;

            } else {
                if (userData.last_job[0] == 'S') {
                    shopData = await shop.findOne({where: {id: userData.last_job.substring(1)}});
                    positionData = null;

                } else if (userData.last_job[0] == 'P') {
                    positionData = await position.findOne({where: {id: userData.last_job.substring(1)}});
                    shopData = await shop.findOne({where: {id: positionData.shop_id}});
                }
                taskData = null;
                boardData = null;
                scheduleData = null;
            }


            console.log("signin success");
            res.json({
                code: "200",
                message:"로그인을 완료했습니다.",
                data:{
                    token,
                    userInfo: userData,
                    shopInfo: shopData,
                    positionInfo: positionData,
                    taskInfo: taskData,
                    boardInfo: boardData,
                    scheduleInfo: scheduleData
                }
            })
            return;

        }
        else {
            console.log("wrong password");
            res.json({
                code: "202",
                message:"비밀번호가 다릅니다."
            })
            return;
        }
    }catch(err){
        console.log(err);
        res.json({
            code: "400",
            message:"로그인에 오류가 발생했습니다."
        })
        return;
    }
});

module.exports = router;