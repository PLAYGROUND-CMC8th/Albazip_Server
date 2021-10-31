var express = require('express');
var router = express.Router();

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
            //const result = jwt.sign(user);
            //const data = await user.findOneAndUpdate({email:email}, {$set:{refreshToken:result.refreshToken}},{new:true}) //리프레시 토큰 db저장

            let shopData, positionData, taskData, boardData, scheduleData;

            if(!userData.last_position) {
                shopData = null;
                positionData = null;
                taskData = null;
                boardData = null;
                scheduleData = null;

            } else {
                if (userData.last_position[0] == 'M') {
                    positionData = await manager.findOne({where: {id: userData.last_position.substring(1)}});

                } else if (userData.last_position[0] == 'W') {
                    positionData = await worker.findOne({where: {id: userData.last_position.substring(1)}});
                    positionData = await position.findOne({where: {id: positionData.position_id}})

                }
                shopData = await shop.findOne({ where: {id: positionData.shop_id} });
                taskData = null;
                boardData = null;
                scheduleData = null;
            }


            console.log("signin success");
            res.json({
                code: "200",
                message:"로그인을 완료했습니다.",
                data:{
                    token: userData.id,
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