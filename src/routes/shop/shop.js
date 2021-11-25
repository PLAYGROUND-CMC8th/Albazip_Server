var express = require('express');
var router = express.Router();

var userUtil = require('../../module/userUtil');

const { time, shop, manager } = require('../../models');

// 매장 변경 전 조회하기
router.get('/:managerId', userUtil.LoggedIn, async (req,res)=>{

    const managerId = req.params.managerId;
    const managerData = await manager.findOne({attributes: ['shop_id'], where: {id: managerId}});
    await shop.findOne({
        attributes: ['name', 'type', 'address', 'holiday', 'payday'],
        where: {id: managerData.shop_id}})
        .then( async(shopData) => {
            console.log("success to get shop data");
            let data = {
                name: shopData.name,
                type: shopData.type,
                address: shopData.address,
                holiday: shopData.dataValues.holiday.split(','),
                payday: shopData.payday
            }
            res.json({
                code: "200",
                message: "매장 편집 전 정보조회에 성공했습니다.",
                data: data
            })
            return;
        })
        .catch((err) => {
            console.log("get shop data error", err);
            res.json({
                code: "400",
                message: "매장 편집 전 정보조회에 오류가 발생했습니다."
            })
            return;
        });
});

// 매장 변경하기
router.put('/:managerId', userUtil.LoggedIn, async (req,res)=>{

});

// 매장 삭제하기
router.delete('/:managerId', userUtil.LoggedIn, async (req,res)=>{

});


module.exports = router;