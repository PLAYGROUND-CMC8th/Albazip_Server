var express = require('express');
var router = express.Router();

var voca = require('voca');
var jwt = require('../../../module/jwt');
var encryption = require('../../../module/encryption');

const { user } = require('../../../models');

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
        var userData = await user.findOne({ where: { phone: phone, status: [1,2] } });
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
        let userData = await user.findOne({ where: { phone: phone,  status: [1,2]} });
        const encryptPwd = (encryption.makeCrypto(pwd, userData.salt)).toString('base64');
        if(encryptPwd == userData.pwd){
            const token = jwt.sign(userData);

            // last_access_data 업데이트
            await user.update({ latest_access_date: new Date()}, {where: {id: userData.id}})
                .then(() => {
                    console.log("user latest access date update success");

                    let job;
                    if(!userData.last_job)
                        job = 0;
                    else if (userData.last_job[0] == 'M')
                        job = 1;
                    else if (userData.last_job[0] == 'W')
                        job = 2;

                    console.log("signin success");
                    res.json({
                        code: "200",
                        message:"로그인을 완료했습니다.",
                        data: {
                            token: token,
                            job: job,  // 0: 없음, 1: 관리자, 2: 근무자
                            userFirstName: userData.first_name
                        }
                    })
                    return;

                })
                .catch((err) => {
                    console.log("user latest access date update error", err);
                });

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


router.post('/password', async (req,res)=> {

    const pwd = req.body.pwd;
    let phone = req.body.phone;
    phone = voca.replaceAll(phone, '-', '');

    const userData = await user.findOne({ where: { phone: phone } });

    // 비밀번호 암호
    const salt = userData.salt;
    const key = encryption.makeCrypto(pwd,salt);

    user.update({pwd: key}, {where: {id: userData.id}})
        .then(updateUser => {
            console.log("success update password ");
            res.status(200).json({
                code: "200",
                message:"성공적으로 비밀번호를 변경했습니다."
            });
            return;
        })
        .catch(err => {
            console.log("user server error:", err );
            res.json({
                code: "400",
                message: "비밀번호 변경에 오류가 발생했습니다."
            });
            return;
        });

});


module.exports = router;