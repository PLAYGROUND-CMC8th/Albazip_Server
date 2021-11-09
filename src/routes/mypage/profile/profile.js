var express = require('express');
var router = express.Router();

var userUtil = require('../../../module/userUtil');
var profileUtil = require('../../../module/profileUtil');

const { user, manager, worker, shop, position, time, board, task, schedule} = require('../../../models');

// 마이페이지 > 상단 > 프로필
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    const profileResult = await profileUtil.getProfile(req.id, req.job);
    return res.json(profileResult);

});


module.exports = router;
