var express = require('express');
var router = express.Router();

var userUtil = require('../../module/userUtil');

const { user, manager, worker, shop, position, time, board, task, schedule } = require('../../models');

// 관리자 마이페이지
router.get('/manager',userUtil.LoggedIn, async (req,res)=> {


});

// 근무자 마이페이지
router.get('/worker',userUtil.LoggedIn, async (req,res)=> {


});


module.exports = router;