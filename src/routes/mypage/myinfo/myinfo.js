var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../module/userUtil');
var positionUtil = require('../../../module/positionUtil');


// 마이페이지 하단 내정보
router.get('/',userUtil.LoggedIn, async (req,res)=> {

    const myinfoResult = await positionUtil.getWorkerInfo(req.job.substring(1));
    return res.json(myinfoResult);

});


module.exports = router;