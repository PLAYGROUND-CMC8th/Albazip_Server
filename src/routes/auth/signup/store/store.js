var express = require('express');
var router = express.Router();
var storeUtil = require('../../../../module/storeUtil');

router.post('/check', storeUtil.check, async function(req, res, next) {

    res.status(200).json({
        message:"사업자등번호가 인증되었습니다."
    });
    return;
});

module.exports = router;