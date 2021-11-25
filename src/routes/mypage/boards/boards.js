var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../module/userUtil');
var boardUtil = require('../../../module/boardUtil');

const { user, position, board, comment } = require('../../../models');


const pagesize = 20;


// 마이페이지 > 하단 > 작성글 > 관리자
router.get('/manager',userUtil.LoggedIn, async (req,res)=> {


    const noticeResult = await boardUtil.getNotice(req.job, 1, 0);
    if( noticeResult.code == "400" ){
        res.json(noticeResult);
        return;
    }

    const postResult = await boardUtil.getPost(req.job, 1);
    if (postResult.code == "400"){
        res.json(postResult);
        return;
    }

    res.json({
        code: "200",
        message: "마이페이지 작성글 조회에 성공했습니다. ",
        data: {
            noticeInfo: noticeResult.data,
            postInfo: postResult.data
        }
    });
    return;

});

// 마이페이지 > 하단 > 작성글 > 근무자
router.get('/worker',userUtil.LoggedIn, async (req,res)=> {

    const postResult = await boardUtil.getPost(req.job, 1);
    if (postResult.code == "400"){
        res.json(postResult);
        return;
    }

    res.json({
        code: "200",
        message: "마이페이지 작성글 조회에 성공했습니다. ",
        data: {
            postInfo: postResult.data
        }
    });
    return;

});


// 마이페이지 > 하단 > 작성글 > 공지사항
router.get('/notice/:page',userUtil.LoggedIn, async (req,res)=> {

    const noticeResult = await boardUtil.getNotice(req.job, req.params.page, 0);
    return res.json(noticeResult);

});


// 마이페이지 > 하단 > 작성글 > 게시글
router.get('/post/:page',userUtil.LoggedIn, async (req,res)=> {

    const postResult = await boardUtil.getPost(req.job, req.params.page);
    return res.json(postResult);

});

module.exports = router;