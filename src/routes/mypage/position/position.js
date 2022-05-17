var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../module/userUtil');
var positionUtil = require('../../../module/positionUtil');

const { worker } = require('../../../models');

// 마이페이지 하단 포지션
router.get('/',userUtil.LoggedIn, async (req,res)=> {

    let workerData;
    try {
        workerData = await worker.findOne({ where : {id: req.job.substring(1)}});
    }
    catch(err) {
        workerData = null;
    }

    const positionResult = await positionUtil.getPositionInfo(workerData.position_id); 
    return res.json(positionResult);
});


module.exports = router;