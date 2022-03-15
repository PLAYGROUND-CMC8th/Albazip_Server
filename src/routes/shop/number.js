var express = require('express');
var router = express.Router();
var shopUtil = require('../../module/shopUtil');


router.get('/exist/:registerNumber', shopUtil.checkRegisterNumber, async function(req, res, next) {

    console.log("register number existed");
    res.json({
        code: "200",
        message:"사업자등번호가 존재합니다."
    });
    return;
});

// K-report 사업자인증조회 크롤링 API
router.get('/match/:registerNumber/:ownerName', shopUtil.checkOwnerName, async function(req, res, next) {

    console.log("register number matched");
    res.json({
        code: "200",
        message:"사업자등번호가 인증되었습니다."
    });
    return;
});

module.exports = router;