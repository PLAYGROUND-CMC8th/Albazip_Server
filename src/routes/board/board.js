var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../module/userUtil');
var boardUtil = require('../../module/boardUtil');

// 관리자, 근무자: 소통창 전체 조회
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    try {
        // 공지사항
        let noticeResult;
        if (req.job[0] == "M")
            noticeResult = await boardUtil.getNotice(req.job, 1, 0);
        else
            noticeResult = await boardUtil.getNotice(req.job, 1, 1);
        if (noticeResult.code == "400") return res.json(noticeResult);

        // 게시글
        let postResult = await boardUtil.getPost(req.job, 1);
        if (postResult.code == "400") return res.json(postResult);

        console.log("sucess to get board data");
        return res.json({
            code: "200",
            message: "소통창 전제 조회를 성공했습니다.",
            data: {
                noticeInfo: noticeResult.data,
                postInfo: postResult.data
            }
        });
    } catch (err) {
        console.log("get board data error", err);
        return res.json({
            code: "400",
            message: "소통창 전제 조회시 오류가 발생했습니다."
        });
    }
});

// 관리자, 근무자: 소통창 전체 검색 (body)
router.get('/search', userUtil.LoggedIn, async (req,res)=> {

    const searchWord = req.body.searchWord;
    try {
        // 공지사항
        const searchNoticeResult = await boardUtil.searchNotice(req.job, 1, searchWord);
        if(searchNoticeResult.code == "400") return res.json(searchNoticeResult);

        // 게시글
        const searchPostResult = await boardUtil.searchPost(req.job, 1, searchWord);
        if(searchPostResult.code == "400") return res.json(searchPostResult);

        console.log("sucess to search board data");
        return res.json({
            code: "200",
            message: "소통창 전제 검색을 성공했습니다.",
            data: {
                noticeSearchInfo: searchNoticeResult.data,
                postSearchInfo: searchPostResult.data
            }
        });
    } catch (err) {
        console.log("search board data error", err);
        return res.json({
            code: "400",
            message: "소통창 전제 검색시 오류가 발생했습니다."
        });
    }
});

// 관리자, 근무자: 소통창 전체 검색 (url)
router.get('/search/word/:searchWord', userUtil.LoggedIn, async (req,res)=> {

    const searchWord = req.params.searchWord;
    try {
        // 공지사항
        const searchNoticeResult = await boardUtil.searchNotice(req.job, 1, searchWord);
        if(searchNoticeResult.code == "400") return res.json(searchNoticeResult);

        // 게시글
        const searchPostResult = await boardUtil.searchPost(req.job, 1, searchWord);
        if(searchPostResult.code == "400") return res.json(searchPostResult);

        console.log("sucess to search board data");
        return res.json({
            code: "200",
            message: "소통창 전제 검색을 성공했습니다.",
            data: {
                noticeSearchInfo: searchNoticeResult.data,
                postSearchInfo: searchPostResult.data
            }
        });
    } catch (err) {
        console.log("search board data error", err);
        return res.json({
            code: "400",
            message: "소통창 전제 검색시 오류가 발생했습니다."
        });
    }
});

module.exports = router;