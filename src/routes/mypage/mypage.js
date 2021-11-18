var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../module/userUtil');
var positionUtil = require('../../module/positionUtil');
var boardUtil = require('../../module/boardUtil');
var profileUtil = require('../../module/profileUtil');

const { user, manager, worker, shop, position, time, board, task, schedule } = require('../../models');

// 관리자 마이페이지
router.get('/manager',userUtil.LoggedIn, async (req,res)=> {
    // 관리자 프로필
    const profileResult = await profileUtil.getProfile(req.job);
    if( profileResult.code == "400" ){
        res.json(profileResult);
        return;
    }

    // 근무자 리스트
    const managerData = await manager.findOne({where: {id: req.job.substring(1)}});
    const workersListResult = await positionUtil.getWorkersList(managerData.shop_id);
    if( workersListResult.code == "400" ){
        res.json(workersListResult);
        return;
    }

    // 작성글 공지사항
    const noticeResult = await boardUtil.getNotice(req.job, 1);
    if( noticeResult.code == "400" ){
        res.json(noticeResult);
        return;
    }

    // 작성글 게시글
    const postResult = await boardUtil.getPost(req.job, 1);
    if( postResult.code == "400" ){
        res.json(postResult);
        return;
    }

    res.json({
        code: "200",
        message: "관리자 마이페이지 조회에 성공했습니다. ",
        data: {
            profileInfo: profileResult.data,
            workerList: workersListResult.data,
            boardInfo : {
                noticeInfo: noticeResult.data,
                postInfo: postResult.data
            }
        }
    });
    return;
});

// 근무자 마이페이지
router.get('/worker',userUtil.LoggedIn, async (req,res)=> {
    // 근무자 프로필
    const profileResult = await profileUtil.getProfile(req.job);
    if( profileResult.code == "400" ){
        res.json(profileResult);
        return;
    }

    const workerData = await worker.findOne({where: {id: req.job.substring(1)}});

    // 근무자 내정보
    const myinfoResult = await positionUtil.getWorkerInfo(workerData.position_id);
    if (myinfoResult.code == "400"){
        return res.json(myinfoResult);
    }

    // 근무자 포지션정보
    const positionInfoResult = await positionUtil.getPositionInfo(workerData.position_id);
    if (positionInfoResult.code == "400"){
        return res.json(positionInfoResult);
    }


    // 작성글 게시글
    const postResult = await boardUtil.getPost(req.job, 1);
    if( postResult.code == "400" ){
        res.json(postResult);
        return;
    }

    res.json({
        code: "200",
        message: "근무자 마이페이지 조회에 성공했습니다. ",
        data: {
            profileInfo: profileResult.data,
            myInfo: myinfoResult.data,
            positionInfo: positionInfoResult.data,
            boardInfo : {
                postInfo: postResult.data
            }
        }
    });
    return;

});


module.exports = router;