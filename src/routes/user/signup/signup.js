var express = require('express');
var router = express.Router();

var voca = require('voca');
var shopUtil = require('../../../module/shopUtil');
var userUtil = require('../../../module/userUtil');
var encryption = require('../../../module/encryption');

const models = require('../../../models');
const { user, position, shop, worker } = require('../../../models');

// 기본가입 휴대폰 중복체크
router.get('/:phone',async (req,res)=> {

    let { phone } = req.params;
    phone = voca.replaceAll(phone, '-', '');

    try {
        if(phone.length != 11){
            console.log("not enough phone number: ", phone);
            return res.json({
                code: "202",
                message:"휴대폰번호 11자리를 입력해주세요."
            });
        }

        let checkPhone = await userUtil.checkPhoneExistance(phone);
        if (checkPhone) {
            console.log(phone + "is already exist");
            return res.json({
                code: "202",
                message: "이미 존재하는 연락처 입니다."
            });
        }
    }catch (err) {
        if(err){
            console.log(phone + "is already exist");
            return res.json({
                code: "400",
                message:"휴대폰 중복체크에 오류가 발생했습니다."
            })
        }
    }

    console.log("phone check success");
    return res.json({
        code: "200",
        message: "새로운 휴대폰번호입니다."
    });

});

//기본가입
router.post('/',async (req,res)=>{

    let { phone, lastName, firstName } = req.body;
    const { pwd, birthyear, gender } = req.body;

    phone = voca.replaceAll(phone, '-', '');

    //1. 파라미터체크
    if(!phone || !pwd || !lastName || !firstName || !birthyear || !gender){
        console.log("not enough parameter: ", phone, pwd, lastName, firstName, birthyear, gender);
        res.json({
            code: "202",
            message: "필수 정보가 부족합니다."
        });
        return;
    }

    //2. 휴대폰정보 중복체크
   /* try {
        if(phone.length != 11){
            console.log("not enough phone number: ", phone);
            return res.status(202).json({
                message:"휴대폰번호 11자리를 입력해주세요."
            });
        }

        let checkPhone = await userUtil.checkPhoneExistance(phone);
        if (checkPhone) {
            console.log(phone + "is already exist");
            return res.status(202).json({
                message: "이미 존재하는 연락처 입니다."
            });
        }
    }catch (err) {
        if(err){
            console.log(phone + "is already exist");
            return res.status(400).json({
                message:"휴대폰 중복체크에 오류가 발생했습니다."
            })
        }
    }*/

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
            return res.json({
                code: "200",
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
        res.json({
            code: "400",
            message:"기본가입에 오류가 발생했습니다."
        })
        return;
    }
});

//매장 등록, 관리자 가입
router.post('/manager',  shopUtil.beforeRegister, async (req,res, next)=> {

    const userId  = req.header('token');
    let { name, ownerName, registerNumber, holiday } = req.body;
    const { type, address, startTime, endTime, payday } = req.body;
    let weekday = ['월', '화', '수', '목', '금', '토', '일'];

    name = voca.replaceAll(name, " ", "");
    ownerName = voca.replaceAll(ownerName, " ", "");
    registerNumber = voca.replaceAll(registerNumber, "-", "");
    let shopBusinessTime = startTime + "-"+ endTime;
    let shopHoliday = holiday.join(", ");

    let shopData = {
        name: name,
        type: type,
        address: address,
        owner_name: ownerName,
        register_number: registerNumber,
        business_time: shopBusinessTime,
        holiday: shopHoliday,
        payday: payday
    };

    models.sequelize.transaction(t=> {
        return models.shop.create(shopData, {transaction: t})
            .then(async(newShop) => {
                console.log("success create shop");

               let workday = weekday.filter((day) => !holiday.includes(day));
               for (const day of workday){
                   let timeData = {
                       status: 0,
                       target_id: newShop.id,
                       day: day,
                       start_time: startTime,
                       end_time: endTime
                   };

                   await models.time.create(timeData, {transaction: t})
                       .catch((err) => {
                           console.log("time server error: ", err);
                               res.json({
                                   code: "400",
                                   message:"매장 요일별 영업시간 등록에 오류가 발생했습니다."
                               });
                               return;
                       });
               }
                console.log("success create times");

               let managerData = {
                   user_id: userId,
                   shop_id: newShop.id,
                   shop_name: shopData.name
               };

               return await models.manager.create(managerData, {transaction: t})
                   .then(async (newManager) => {
                       console.log("success create manager: ", newManager.id);

                       return await models.user.update({last_position: "M"+newManager.id}, {where: {id: userId}, transaction: t})
                           .then(async (updateUser) => {
                               console.log("success update last position: ", updateUser);

                               console.log("success manager signup: ", newManager);
                               return res.json({
                                   code: "200",
                                   message: "성공적으로 관리자 가입이 완료되었습니다."
                               });
                           })
                           .catch((err) => {
                               console.log("user last position update error: ", err);
                               res.json({
                                   code: "400",
                                   message:"사용자 마지막 포지션 정보 업데이트에 오류가 발생했습니다."
                               });
                               return;
                           });
                   })
                   .catch((err) => {
                   console.log("manager server error: ", err);
                   res.json({
                       code: "400",
                       message:"관리자 가입에 오류가 발생했습니다."
                   });
                   return;
               });
            })
            .catch((err) => {
                    console.log("shop server error: ", err);
                    res.json({
                        code: "400",
                        message:"매장 등록에 오류가 발생했습니다."
                    });
                    return;
            })
    });

});

//근무자 가입
router.post('/worker',async (req,res)=> {

    const userId  = req.header('token');

    const code = req.body.code;
    const positionData = await position.findOne({ attributes: ['id', 'shop_id', 'title'], where: {code: code} });
    const shopData = await shop.findOne({ attributes: ['name'] , where: {id: positionData.shop_id} });

    try {
        worker.create({
            user_id: userId,
            position_id: positionData.id,
            shop_name: shopData.name,
            position_title: positionData.title

        }).then(async (newWorker) => {
            console.log("success create worker");

            await models.user.update({last_position: "W"+newWorker.id}, {where: {id: userId}})
                .then(async (updateUser) => {
                    console.log("success update last position");

                    console.log("success worker signup");
                    return res.json({
                        code: "200",
                        message: "성공적으로 근무자 가입이 완료되었습니다."
                    });
                })
                .catch((err) => {
                    console.log("user last position update error: ", err);
                    res.json({
                        code: "400",
                        message:"사용자 마지막 포지션 정보 업데이트에 오류가 발생했습니다."
                    });
                    return;
                });
        })
    }catch(err){
        console.log("user server error: ", err);
        res.json({
            code: "400",
            message:"근무자 가입에 오류가 발생했습니다."
        })
        return;
    }

});

module.exports = router;