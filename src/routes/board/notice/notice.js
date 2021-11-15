var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../module/userUtil');

const { board } = require('../../../models');


router.put('/pin/:noticeId', userUtil.LoggedIn, async (req,res)=> {

    const noticeId = req.params.noticeId;
    const boardData = await board.findOne({ attributes:['pin'], where: {id: noticeId, status: 0}});

    board.update({pin: (boardData.pin + 1)%2 }, {where: {id: noticeId, status: 0 }})
        .then(() => {
            console.log("success to pin notice");
            return res.json({
                code: "200",
                message: "공지사항의 핀 설정변경을 성공했습니다. "
            });
        })
        .catch((err) => {
            console.log("pin notice error", err);
            return res.json({
                code: "400",
                message: "공지사항의 핀 설정변경에 오류가 발생했습니다. "
            });
        })

});

module.exports = router;