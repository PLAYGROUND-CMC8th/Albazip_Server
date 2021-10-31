var express = require('express');
var router = express.Router();

var voca = require('voca');
var encryption = require('../../../module/encryption');

const { user } = require('../../../models');

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