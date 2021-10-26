var express = require('express');
var router = express.Router();

var voca = require('voca');
var shopUtil = require('../../../module/shopUtil');
var userUtil = require('../../../module/userUtil');
var encryption = require('../../../module/encryption');

const models = require('../../../models');


router.post('/',async (req,res)=>{

    let {phone, lastName, firstName} = req.body;
    const {pwd, birthyear, gender} = req.body;

    //1. 파라미터체크
    if(!phone || !pwd || !lastName || !firstName || !birthyear || !gender){
        console.log("not enough parameter: ", phone, pwd, lastName, firstName, birthyear, gender);
        res.status(202).json({
            message: "필수 정보가 부족합니다."
        });
        return;
    }

    //2. 휴대폰정보 중복체크
    try {
        phone = voca.replaceAll(phone, '-', '');
        let checkPhone = await userUtil.checkPhoneExistance(phone);
        if (checkPhone) {
            console.log(phone + "is already exist");
            return res.status(202).json({
                message: "이미 존재하는 연락처 입니다."
            });
        }
    }catch (err) {
        if(err){
            res.status(400).json({
                message:"phone number server error"
            })
            return;
        }
    }

    //3. 비밀번호 암호화
    const salt = encryption.salt();
    const key = encryption.makeCrypto(pwd,salt);

    //4. 기본가입 완료
    lastName = voca.replaceAll(lastName, " ", "");
    firstName = voca.replaceAll(firstName, " ", "");
    try {
        user.create({
            phone: phone,
            pwd: key,
            salt: salt,
            last_name: lastName,
            first_name: firstName,
            birthyear:birthyear,
            gender: gender == 'M'? 0 : 2
        }).then((newUser) => {
            console.log("signup success " + newUser);
            return res.status(200).json({
                message: "성공적으로 기본가입이 완료되었습니다.",
                data: {
                    token:newUser.id
                }
            });
        }).catch(err => {
            console.log(err);
        })
    }catch(err){
        console.log("user server error: ", err);
        res.status(400).json({
            message:"기본가입에 오류가 발생했습니다."
        })
        return;
    }
});

router.post('/manager',  shopUtil.beforeRegister, async (req,res, next)=> {

    const userId  = req.header('token');
    let {name, ownerName, registerNumber} = req.body;
    const {type, address, startTime, endTime, holiday, payday } = req.body;

    name = voca.replaceAll(name, " ", "");
    ownerName = voca.replaceAll(ownerName, " ", "");
    registerNumber = voca.replaceAll(registerNumber, "-", "");

    let shopData = {
        name: name,
        type: type,
        address: address,
        owner_name: ownerName,
        register_number: registerNumber,
        business_time: startTime + "-"+ endTime,
        holiday: holiday,
        payday: payday
    };

    try{
        models.sequelize.transaction(t=> {
            return models.shop.create(shopData, {transaction: t})
                .then(newShop => {
                    let managerData = {
                        user_id: userId,
                        shop_id: newShop.id,
                        shop_name: shopData.name
                    };
                    models.manager.create(managerData)
                        .then((newManager) => {
                            console.log("manager signup success " + newManager);
                            return res.status(200).json({
                                message: "성공적으로 관리자 가입이 완료되었습니다."
                            });
                        });
                })

        });
    }catch (err) {
        console.log("manager server error: ", err);
        res.status(400).json({
            message:"관리자 가입에 오류가 발생했습니다."
        })
        return;
    }
});

router.post('/worker',async (req,res)=> {

    const userId  = req.header('token');

    const code = req.body;
    const position = await position.find({ attributes: ['id', 'shop_id', 'title'], where: {code: code} });
    const shopName = await shop.find({ attributes: 'name', where: {id: position.shop_id} });


    try {
        worker.create({
            user_id: userId,
            position_id: position.id,
            shop_name: shopName,
            position_title: position.title

        }).then((newWorker) => {
            console.log("worker signup success " + newWorker);
            return res.status(200).json({
                message: "성공적으로 근무자 가입이 완료되었습니다."
            });
        })
    }catch(err){
        console.log("user server error: ", err);
        res.status(400).json({
            message:"근무자 가입에 오류가 발생했습니다."
        })
        return;
    }

});


module.exports = router;