var express = require('express');
var router = express.Router();

var userUtil = require('../../../module/userUtil');

const { user, manager, worker, shop, position, time, board, task, schedule} = require('../../../models');


// 마이페이지 하단 내정보
router.get('/',userUtil.LoggedIn, async (req,res)=> {

});



module.exports = router;