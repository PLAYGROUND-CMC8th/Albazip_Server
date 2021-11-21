var express = require('express');
var router = express.Router();

var voca = require('voca');

var userUtil = require('../../../module/userUtil');

const { user, manager, worker } = require('../../../models');


// 마이페이지 > 설정 > 나의정보 조회
router.get('/myinfo',userUtil.LoggedIn, async (req,res)=> {

    await user.findOne({
        attributes: [["first_name", "firstName"],["last_name", "lastName"], "birthyear", "gender", "phone"],
        where: {id: req.id}
    })
        .then((userData) => {
            console.log("success to get setting user myinfo");
            res.json({
                code: "200",
                message: "사용자 내정보 조회에 성공했습니다. ",
                data: userData
            });
            return;
        })
        .catch((err) => {
            console.log("get setting user myinfo error", err);
            res.json({
                code: "400",
                message: "사용자 내정보 조회에 오류가 발생했습니다. "
            });
            return;
        })


});

// 마이페이지 > 설정 > 나의정보 > 나의정보 업데이트
router.post('/myinfo',userUtil.LoggedIn, async (req,res)=> {

    const {firstName, lastName, birthyear, gender} = req.body;

    if (!firstName || !lastName || !birthyear || !gender) {
        console.log("not enough parameter");
        res.json({
            code: "202",
            message: "필수 정보가 부족합니다."
        });
        return;
    }

    try {
        await user.update({
            first_name: firstName, last_name: lastName,
            birthyear: birthyear, gender: gender
        }, {where: {id: req.id}});
        console.log("success to update user info");
    }
    catch(err) {
        console.log("update user info error", err );
        res.json({
            code: "400",
            message: "사용자 유저정보 변경에 오류가 발생했습니다."
        });
        return;
    }

    try {
        await manager.update({
            user_first_name: firstName,
            user_last_name: lastName
        }, {where: {user_id: req.id}});
        console.log("success to update user manager info");
    }
    catch(err) {
        console.log("update user manager info error", err );
        res.json({
            code: "400",
            message: "사용자의 관리자정보 변경에 오류가 발생했습니다."
        });
        return;
    }

    try {
        await worker.update({
            user_first_name: firstName
        }, {where: {user_id: req.id}});
        console.log("success to update user worker info");
    }
    catch(err) {
        console.log("update user worker info error", err );
        res.json({
            code: "400",
            message: "사용자의 근무자정보 변경에 오류가 발생했습니다."
        });
        return;
    }

    console.log("success to update setting myinfo");
    res.json({
       code: "200",
       message: "사용자의 근무자 내정보 변경을 성공했습니다."
    });

});

// 마이페이지 > 설정 > 나의정보 > 휴대폰번호 업데이트
router.post('/myinfo/phone',userUtil.LoggedIn, async (req,res)=> {

    let phone = req.body.phone;
    phone = voca.replaceAll(phone, '-', '');

    if(!phone){
        console.log("not enough parameter");
        res.json({
            code: "202",
            message: "휴대폰 번호를 입력해주세요."
        });
        return;
    }

    user.update({phone: phone}, {where: {id: req.id}})
        .then(updateUser => {

            console.log("success to update setting user phone info");
            res.status(200).json({
                code: "200",
                message:"사용자 휴대폰번호 변경을 성공했습니다."
            });
            return;
        })
        .catch((err) => {
            console.log("update setting user phone info error", err );
            res.json({
                code: "400",
                message: "사용자 휴대폰번호 변경에 오류가 발생했습니다."
            });
            return;
        });
});

module.exports = router;