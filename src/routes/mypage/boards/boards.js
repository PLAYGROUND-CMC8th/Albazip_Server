var express = require('express');
var router = express.Router();

var userUtil = require('../../../module/userUtil');

const { user, position, board, comment } = require('../../../models');

const pagesize = 20;

// 마이페이지 > 하단 > 작성글
router.get('/',userUtil.LoggedIn, async (req,res)=> {

    try {
        let boardData = {};

        // 공지사항
        let noticeData;
        if (req.job[0] == 'S') {

            try {
                noticeData = await board.findAll({
                    limit: pagesize,
                    attributes: ['id', 'pin', 'title', 'register_date'],
                    where: {writer_job: req.job, status: 0},
                    order: [['register_date', 'DESC']]
                });
                console.log("success to get recent notice");
            } catch (err) {
                console.log("get recent notice error", err);
                res.json({
                    code: "400",
                    message: "공지사항 조회에 오류가 발생했습니다.",
                })
                return;
            }
        }

        // 게시글
        let postData;

        try {
            postData = await board.findAll({
                limit: pagesize,
                attributes: ['id', 'title', 'content', 'register_date'],
                where: {writer_job: req.job, status: 1},
                order: [['register_date', 'DESC']]
            });
            console.log("success to get recent post");
            ;
        } catch (err) {
            console.log("get recent post error", err);
            res.json({
                code: "400",
                message: "게시글 조회에 오류가 발생했습니다.",
            })
            return;
        }

        let writerJob;
        if (req.job[0] == 'S') {
            writerJob = "사장님";
        } else {
            try {
                const positionData = await position.findOne({attributes: ['title'], where: {id: req.job.substring(1)}});
                console.log("success to get writer position data");
                writerJob = positionData.title;
            } catch (err) {
                console.log("get writer position data error", err);
                writerJob = null;
            }
        }

        let writerName;
        try {
            const userData = await user.findOne({attributes: ['last_name', 'first_name'], where: {id: req.id}});
            console.log("success to get writer name data");
            writerName = userData.last_name + userData.first_name;
        } catch {
            console.log("get writer name data error", err);
            writerName = null;
        }

        let postInfo = [];
        if (postData) {
            for (const pdata of postData) {

                let commentCount;
                try {
                    const count = await comment.count({where: {status: [1, 2], board_id: pdata.id}});
                    console.log("success to get comment count data");
                    commentCount = count;
                } catch (err) {
                    console.log("get comment count data error", err);
                    commentCount = null;
                }

                let data = {
                    id: pdata.id,
                    writer_job: writerJob,
                    writer_name: writerName,
                    title: pdata.title,
                    content: pdata.content,
                    commentCount: commentCount,
                    register_date: pdata.register_date
                }
                postInfo.push(data);
            }
        }

        console.log("success to get mypage boards");
        res.json({
            code: "200",
            message: "마이페이지 작성글 조회에 성공했습니다. ",
            data: {
                notice_info: noticeData,
                post_info: postInfo
            }
        });
        return;
    }
    catch (err) {
        console.log("get mypage boards error");
        res.json({
            code: "400",
            message: "마이페이지 작성글 조회에 실패했습니다. ",
        });
        return;
    }

});

// 마이페이지 > 하단 > 작성글 > 공지사항
router.get('/notice/:page',userUtil.LoggedIn, async (req,res)=> {

    let reqPage;
    if(req.params.page )
        reqPage = req.params.page;
    else
        reqPage = 1;
    const offset = 0 + (reqPage - 1) * pagesize
    console.log("request notice page",reqPage);

    await board.findAll({
        limit: pagesize,
        attributes: ['id', 'pin', 'title', 'register_date'],
        where: { writer_job: req.job, status: 0 },
        order: [ [ 'register_date', 'DESC' ]]
    })
        .then((noticeData) => {
            console.log("success to get recent notice");
            res.json({
                code: "200",
                message: "공지사항 조회에 성공했습니다.",
                page: reqPage,
                data: noticeData
            })
            return;
        })
        .catch((err) => {
            console.log("get recent notice error", err);
            res.json({
                code: "400",
                message: "공지사항 조회에 오류가 발생했습니다.",
            })
            return;
        });


});

// 마이페이지 > 하단 > 작성글 > 게시글
router.get('/post/:page',userUtil.LoggedIn, async (req,res)=> {



    try {
        let reqPage;
        if(req.params.page )
            reqPage = req.params.page;
        else
            reqPage = 1;
        const offset = 0 + (reqPage - 1) * pagesize

        console.log("request post page", reqPage);

        // 게시글
        let postData;
        try {
            postData = await board.findAll({
                offset: offset,
                limit: pagesize,
                attributes: ['id', 'title', 'content', 'register_date'],
                where: {writer_job: req.job, status: 1},
                order: [['register_date', 'DESC']]
            });
            console.log("success to get recent post");
        } catch (err) {
            console.log("get recent post error", err);
            res.json({
                code: "400",
                message: "게시글 조회에 오류가 발생했습니다.",
            })
            return;
        }


        let writerJob;
        if (req.job[1] == 'S') {
            writerJob = "사장님";
        } else {
            try {
                const positionData = await position.findOne({attributes: ['title'], where: {id: req.job.substring(1)}});
                console.log("success to get writer position data");
                writerJob = positionData.title;
            } catch (err) {
                console.log("get writer position data error", err);
                writerJob = null;
            }
        }

        let writerName;
        try {
            const userData = await user.findOne({attributes: ['last_name', 'first_name'], where: {id: req.id}});
            console.log("success to get writer name data");
            writerName = userData.last_name + userData.first_name;
        } catch {
            console.log("get writer name data error", err);
            writerName = null;
        }

        let postInfo = [];
        if (postData) {
            for (const pdata of postData) {

                let commentCount;
                try {
                    let count = await comment.count({where: {status: [1, 2], board_id: pdata.id}});
                    console.log("success to get comment count data");
                    commentCount = count;
                } catch (err) {
                    console.log("get comment count data error", err);
                    commentCount = 0;
                }

                let data = {
                    id: pdata.id,
                    writer_job: writerJob,
                    writer_name: writerName,
                    title: pdata.title,
                    content: pdata.content,
                    commentCount: commentCount,
                    register_date: pdata.register_date
                }
                postInfo.push(data);
            }
        }

        console.log("success to get mypage post");
        res.json({
            code: "200",
            message: "마이페이지 게시글 조회에 성공했습니다. ",
            page: reqPage,
            data: postInfo
        });
        return;
    }
    catch (err){
        console.log("get mypage post error");
        res.json({
            code: "400",
            message: "마이페이지 게시글 조회에 오류가 발생했습니다. ",
        });
        return;
    }

});

module.exports = router;