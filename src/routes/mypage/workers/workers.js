var express = require('express');
var router = express.Router();

var userUtil = require('../../../module/userUtil');

const { user, manager, worker, shop, position, time, board, task, schedule} = require('../../../models');

// 마이페이지 > 하단 > 근무자
router.get('/',userUtil.LoggedIn, async (req,res)=> {

    let positionData;
    try {
        positionData = await position.findAll({where: {shop_id: req.job.substring(1)}});
        console.log("success to get shop positions");
    }
    catch {
        console.log("get shop positions error", err);
        res.json({
            code: "400",
            message: "포지션 정보 조회에 오류가 발생했습니다.",
        })
        return;
    }

    let positionInfo = [];
    try {
        if(positionData) {
            for (const pdata of positionData) {

                try {
                    let workerData = await worker.findOne({where: {position_id: pdata.id}});
                } catch {
                    workerData = null;
                }

                let data = {
                    id: pdata.id,
                    status: worker.status,
                    rank: pdata.rank,
                    image_path: pdata.image_path,
                    title: pdata.title,
                    first_name: worker.user_first_name
                }
                positionInfo.push(data);
            }
        }
    }
    catch(err) {
        console.log("get mypage workers error", err);
        res.json({
            code: "400",
            message: "근무자 정보 조회에 오류가 발생했습니다.",
        })
        return;
    }

    console.log("success get mypage worker info");
    res.json({
        code: "200",
        message: "근무자 정보 조회에 성공했습니다.",
        data: positionInfo
    });
    return;

});

module.exports = router;