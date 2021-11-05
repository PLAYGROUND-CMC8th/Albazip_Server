var express = require('express');
var router = express.Router();

var userUtil = require('../../../module/userUtil');

const { user, manager, worker, shop, position, time, board, task, schedule} = require('../../../models');

// 마이페이지 > 상단 > 프로필
router.get('/',userUtil.LoggedIn, async (req,res)=> {

    try {
        let jobData, positionData;
        const userData = await user.findOne({where: {id: req.id}});
        if(req.job[0] == 'S'){
            jobData = await manager.findOnd({where: {shop_id: req.job.substring(1)}});
            const shopData = await shop.findOne({attributes: [ 'image_path' ], where: {id: req.job.substring(1)}});
        } else {
            jobData = await worker.findOne({where: {position_id: req.job.substring(1)}});
            positionData = await position.findOne({attributes: [ 'image_path' ], where: {id: req.job.substring(1)}});
        }

        const profileData = {
            shopName: jobData.shop_name,
            jobTitle: req.job[0] == 'S'? "사장님": jobData.position_title,
            lastName: userData.last_name,
            firstName: userData.first_name,
            image_path: req.job[0] == 'S'? shopData.image_path: positionData.image_path
        }

        console.log("success get mypage profile");
        res.json({
            code: "200",
            message: "프로필 조회를 성공했습니다.",
            data: profileData
        })
    }

    catch(err) {
        console.log("get mypage profile error", err);
        res.json({
            code: "400",
            message: "프로필 정보 조회시 오류가 발생했습니다."
        })
    }
});


module.exports = router;