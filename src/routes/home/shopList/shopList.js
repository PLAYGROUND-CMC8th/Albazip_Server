var express = require('express');
var router = express.Router();

const sequelize = require('sequelize');

var jwt = require('../../../module/jwt');
var userUtil = require('../../../module/userUtil');

const { user, manager, worker } = require('../../../models');


// 공통: 매장목록
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    let shopList = [];

    try {
        const managerData = await manager.findAll({attributes: [['id', 'managerId'], 'shop_name'], where: {user_id: req.id}});
        if(managerData) {
            for(const mdata of managerData) {
                mdata.dataValues['status'] = 0;
                shopList.push(mdata.dataValues);
            }
        }
        console.log("success to get user's manager data");
    }
    catch(err) {
        console.log("get user's manager data error", err);
        res.json({
            code: "400",
            message: "유저의 매장목록 중 관리자 정보 조회에 오류가 발생했습니다."
        })
        return;
    }

    try {
        const workerData = await worker.findAll({attributes: [['id', 'workerId'], 'shop_name'], where: {user_id: req.id}});
        if(workerData){
            for(const wdata of workerData) {
                wdata.dataValues['status'] = 1;
                shopList.push(wdata.dataValues);
            }
        }
    }
    catch(err) {
        console.log("get user's worker data error", err);
        res.json({
            code: "400",
            message: "유저의 매장목록 중 근무자 정보 조회에 오류가 발생했습니다."
        })
        return;
    }

    console.log("success to get user manager and worker data");
    res.json({
        code: "200",
        message: "유저의 매장목록 조회를 성공했습니다.",
        data: shopList
    })
    return;

});

// 공통: 관리자 매장목록 이동
router.put('/manager/:managerId', userUtil.LoggedIn, async (req,res)=> {

    try {
        const managerId = req.params.managerId;
        await user.update({last_job: "M" + managerId}, {where: {id: req.id}});

        const userData = await user.findOne({where: {id: req.id}});
        const token = jwt.sign(userData);

        console.log("success to update user last job");
        res.json({
            code: "200",
            message: "유저의 job 정보 업데이트를 성공했습니다.",
            token: token
        })
        return;
    }
    catch(err) {
        console.log("update user last job error", err);
        res.json({
            code: "400",
            message: "유저의 job 정보 업데이트에 오류가 발생했습니다."
        })
        return;
    }

});

// 공통: 근무자 매장목록 이동
router.put('/worker/:workerId', userUtil.LoggedIn, async (req,res)=> {

    try {
        const workerId = req.params.workerId;
        await user.update({last_job: "W" + workerId}, {where: {id: req.id}});

        const userData = await user.findOne({where: {id: req.id}});
        const token = jwt.sign(userData);

        console.log("success to update user last job");
        res.json({
            code: "200",
            message: "유저의 job 정보 업데이트를 성공했습니다.",
            token: token
        })
        return;
    }
    catch(err) {
        console.log("update user last job error", err);
        res.json({
            code: "400",
            message: "유저의 job 정보 업데이트에 오류가 발생했습니다."
        })
        return;
    }
});


module.exports = router;
