var express = require('express');
var router = express.Router();

var encryption = require('../../../module/encryption');

const { user, manager, worker } = require('../../../models');

router.post('/',async (req,res)=>{

    const{ phone, pwd } = req.body;

    //1. 파라미터체크
    if(!phone || !pwd){
        console.log("not enough parameter");
        res.status(202).json({
            message: "휴대폰번호와 비밀번호를 입력해주세요."
        });
        return;
    }

    //2.휴대폰번호 확인
    try{
        var userData = await user.findOne({ where: { phone: phone } });
        if(!userData){
            console.log("no such user");
            res.status(202).json({
                message:"존재하지 않는 계정입니다."
            })
            return;
        }
    } catch(err){
        console.log("user server error");
        res.status(400).json({
            message:"휴대폰번호 확인시 오류가 발생했습니다."
        })
        return;
    }

    //3.비밀번호 체크
    try{
        const userData = await user.findOne({ where: { phone: phone } });
        const encryptPwd = (encryption.makeCrypto(pwd, userData.salt)).toString('base64');
        if(encryptPwd == userData.pwd){
            //const result = jwt.sign(user);
            //const data = await user.findOneAndUpdate({email:email}, {$set:{refreshToken:result.refreshToken}},{new:true}) //리프레시 토큰 db저장

            const managerData =  await manager.findAll({ where: {user_id: userData.id} });
            const workerData = await worker.findAll({ where: {user_id: userData.id} });

            let positionInfo = null;
            if(managerData){
                position_info = managerData[0];
            }
            else if(workerData){
                position_info = managerData[0];
            }

            console.log("signin success");
            res.status(200).json({
                message:"로그인 완료",
                data:{
                    userId: userData.id,
                    positionInfo: positionInfo
                }
            })
            return;

        }
        else {
            console.log("wrong password");
            res.status(202).json({
                message:"비밀번호가 다릅니다."
            })
            return;
        }
    }catch(err){
        console.log(err);
        res.status(400).json({
            message:"로그인에 오류가 발생했습니다."
        })
        return;
    }
})

module.exports = router;