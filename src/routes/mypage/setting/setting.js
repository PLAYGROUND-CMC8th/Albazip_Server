var express = require('express');
var router = express.Router();

var voca = require('voca');

var userUtil = require('../../../module/userUtil');

const { user } = require('../../../models');

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

router.post('/myinfo/update',userUtil.LoggedIn, async (req,res)=> {

    const { firstName, lastName, birthyear, gender } = req.body;

    if(!firstName || !lastName || !birthyear || !gender){
        console.log("not enough parameter");
        res.json({
            code: "202",
            message: "필수 정보가 부족합니다."
        });
        return;
    }

    user.update({
        first_name: firstName,
        last_name: lastName,
        birthyear: birthyear,
        gender: gender
    }, {where: {id: req.id}})
        .then(updateUser => {

            console.log("success to update setting user myinfo");
            res.status(200).json({
                code: "200",
                message:"사용자 내정보 변경을 성공했습니다."
            });
            return;
        })
        .catch((err) => {
            console.log("update setting user myinfo error", err );
            res.json({
                code: "400",
                message: "사용자 내정보 변경에 오류가 발생했습니다."
            });
            return;
        });

});

router.post('/myinfo/phone/update',userUtil.LoggedIn, async (req,res)=> {

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