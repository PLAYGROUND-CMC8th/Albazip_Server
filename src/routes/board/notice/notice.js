var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var upload = require('../../../module/multer');
var userUtil = require('../../../module/userUtil');
var boardUtil = require('../../../module/boardUtil');

const { board, board_image, comment, manager, worker, report } = require('../../../models');

// 관리자, 근무자: 공지사항
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    let noticeResult;
    if(req.job[0] == "M")
        noticeResult = await boardUtil.getNotice(req.job, 1, 0);
    else
        noticeResult = await boardUtil.getNotice(req.job, 1, 1);

    return res.json(noticeResult);

});

// 관리자, 근무자: 공지사항 페이지
router.get('/page/:page', userUtil.LoggedIn, async (req,res)=> {

    const reqPage = req.params.page;

    let noticeResult;
    if(req.job[0] == "M")
        noticeResult = await boardUtil.getNotice(req.job, reqPage, 0);
    else
        noticeResult = await boardUtil.getNotice(req.job, reqPage, 1);

    return res.json(noticeResult);

});

// 관리자: 공지사항 작성 (이미지 업로드)
router.post('/', userUtil.LoggedIn, upload.array('images', 2), async (req,res)=> {

    // 공지사항 작성
    const { title, content } = req.body;
    const managerData = await manager.findOne({attributes: ['shop_id'], where:{id: req.job.substring(1)}});

    // 0. 관리자만 작성
    if(req.job[0] != "M"){
        console.log("only manager can write notice");
        return res.json({
            code: "202",
            message: "공지사항은 관리자만 작성할 수 있습니다."
        });
    }

    // 1. 파라미터 체크
    if( !title || !content ){
        console.log("board parameter not enough");
        return res.json({
            code: "202",
            message: "필수정보가 부족합니다."
        });
    }

    let boardData = {
        shop_id: managerData.shop_id,
        writer_job: req.job,
        pin: 0,
        status: 0,
        title: title,
        content: content
    };

    // 2. 공지사항 생성
    await board.create(boardData)
        .then(async (newBoard) => {
            console.log("success to create notice");

            // 3. 공지사항 이미지 생성
            try {
                if (req.files && req.files.length > 0) {
                    for (const file of req.files) {
                        await board_image.create({
                            board_id: newBoard.id,
                            image_path: file.location
                        })
                    }
                    console.log("success to create notibe image");
                }

                return res.json({
                    code: "200",
                    message: "공지사항 생성을 성공했습니다."
                });
            }
            catch(err) {
                console.log("create notibe image error", err);
                return res.json({
                    code: "400",
                    message: "공지사항 이미지 생성에 오류가 발생했습니다."
                });
            }
        })
        .catch((err) => {
            console.log("create notice error", err);
            return res.json({
                code: "400",
                message: "공지사항 생성에 오류가 발생했습니다."
            });
        })

});

// 관리자: 공지사항 핀
router.put('/pin/:noticeId', userUtil.LoggedIn, async (req,res)=> {

    // 관리자인지 체크
    if(req.job[0] != "M"){
        console.log("manager can only pin notice");
        return res.json({
            code: "202",
            message: "관리자만 공지사항 핀을 설정할 수 있습니다."
        });
    }

    const noticeId = req.params.noticeId;
    const boardData = await board.findOne({ attributes:['pin'], where: {id: noticeId, status: 0}});


    // 최대 5개까지
    const managerData = await manager.findOne({attributes:['shop_id'], where: {id: req.job.substring(1)}});
    const boardPinCount = await board.count({where: {pin: 1, status: 0, shop_id: managerData.shop_id}});
    if(boardData.pin == 0 && boardPinCount > 4){
        console.log("max number of pin is only 5");
        return res.json({
            code: "202",
            message: "핀 고정은 최대 5개 입니다."
        });
    }

    board.update({pin: (boardData.pin + 1)%2 }, {where: {id: noticeId, status: 0 }})
        .then(() => {
            console.log("success to pin notice");
            return res.json({
                code: "200",
                message: "공지사항의 핀 설정변경을 성공했습니다."
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

// 공지사항 검색 (body)
router.get('/search', userUtil.LoggedIn, async (req,res)=> {

    const searchWord = req.body.searchWord;
    const searchNoticeResult = await boardUtil.searchNotice(req.job, 1, searchWord);
    return res.json(searchNoticeResult);

});

// 공지사항 검색 (url)
router.get('/search/word/:searchWord', userUtil.LoggedIn, async (req,res)=> {

    const searchWord = req.params.searchWord;
    const searchNoticeResult = await boardUtil.searchNotice(req.job, 1, searchWord);
    return res.json(searchNoticeResult);

});

// 공지사항 검색 페이지 (body)
router.get('/search/:page', userUtil.LoggedIn, async (req,res)=> {

    const reqPage = req.params.page;
    const searchWord = req.body.searchWord;
    const searchNoticeResult = await boardUtil.searchNotice(req.job, reqPage, searchWord);
    return res.json(searchNoticeResult);

});

// 공지사항 검색 페이지 (url)
router.get('/search/word/:searchWord/:page', userUtil.LoggedIn, async (req,res)=> {

    const reqPage = req.params.page;
    const searchWord = req.params.searchWord;
    const searchNoticeResult = await boardUtil.searchNotice(req.job, reqPage, searchWord);
    return res.json(searchNoticeResult);

});

// 공지사항 신고
router.post('/report', userUtil.LoggedIn, async (req,res)=> {

    try {
        const {noticeId, reportReason} = req.body;
        const noticeData = await board.findOne({attributes: ['writer_job'], where: {id: noticeId}});

        // 필수값 체크
        if(!noticeId || !reportReason){
            console.log("not enougn parameter");
            res.json({
                code: "202",
                message: "필수값을 입력해주세요."
            });
            return;
        }

        let userId;
        try {
            if (noticeData.writer_job[0] == 'M') {
                const managerData = await manager.findOne({
                    attributes: ['user_id'],
                    where: {id: noticeData.writer_job.substring(1)}
                });
                userId = managerData.user_id;
            } else (noticeData.writer_job[0] == 'W')
            {
                const workerData = await worker.findOne({
                    attributes: ['user_id'],
                    where: {id: noticeData.writer_job.substring(1)}
                });
                userId = workerData.user_id;
            }
        }
        catch(err){
            userId = null;
        }

        const reportData = {
            user_id: userId,
            job: noticeData.writer_job,
            status: 0,
            target_id: noticeId,
            reason: reportReason,
            reporter_job: req.job
        };
        await report.create(reportData);
        console.log("success to report notice");
        res.json({
            code: "200",
            message: "신고하기 접수를 성공했습니다."
        });
        return;
    }
    catch(err) {
        console.log("report notice error", err);
        res.json({
            code: "400",
            message: "신고하기 접수에 오류가 발생했습니다."
        });
        return;
    }

});

// 관리자, 근무자: 공지사항 읽기
router.get('/:noticeId', userUtil.LoggedIn, async (req,res)=> {

    try {
        const noticeId = req.params.noticeId;
        const boardData = await board.findOne({where: {id: noticeId}});
        const boardImageData = await board_image.findAll({
            attributes: ['id', 'image_path'],
            where: {board_id: noticeId}
        });

        // 작성자
        let writerTitle, writerName, writerImage;
        try {
            if (boardData.writer_job[0] == "M") {
                let managerData = await manager.findOne({where: {id: boardData.writer_job.substring(1)}});
                writerTitle = "사장님";
                writerName = managerData.user_last_name + managerData.user_first_name;
                writerImage = managerData.image_path;
            } else if (boardData.writer_job[0] == "W") {
                let workerData = await worker.findOne({where: {id: boardData.writer_job.substring(1)}});
                writerTitle = workerData.position_title;
                writerName = workerData.user_first_name;
                writerImage = workerData.image_path;
            }
            console.log("success to get writer info");
        } catch (err) {
            console.log("get writer info error", err);
            writerTitle = null;
            writerName = null;
            writerImage = null;
        }

        // 확인자
        let confirmInfo = [];
        let confirmData = await comment.findAll({attributes: ['writer_job'], where: {board_id: noticeId, status: 0}, group: ['writer_job']});
        if (confirmData) {
            for (const cdata of confirmData) {
                let writerTitle, writerName, writerImage;
                if (cdata.writer_job[0] == "M") {
                    let managerData = await manager.findOne({where: {id: cdata.writer_job.substring(1)}});
                    let info = {
                        writerTitle: "사장님",
                        writerName: managerData.user_last_name + managerData.user_first_name,
                        writerImage: managerData.image_path
                    };
                    confirmInfo.push(info);

                } else if (cdata.writer_job[0] == "W") {
                    let workerData = await worker.findOne({where: {id: cdata.writer_job.substring(1)}});
                    if(workerData) {
                        let info = {
                            writerTitle: workerData.position_title,
                            writerName: workerData.user_first_name,
                            writerImage: workerData.image_path
                        };
                        confirmInfo.push(info);
                    }
                }
            }
        }
        console.log("success to get a notice data");
        let boardInfo = {
            writerInfo: {
                title: writerTitle,
                name: writerName,
                image: writerImage
            },
            boardInfo: {
                title: boardData.title,
                content: boardData.content,
                registerDate: boardData.register_date,
                image: boardImageData
            },
            confirmInfo: {
                count: confirmInfo.length,
                confirmer: confirmInfo
            }
        };
        return res.json({
            code: "200",
            message: "공지사항 일기를 성공했습니다.",
            data: boardInfo
        });
    }
    catch(err) {
        console.log("get a notice data error", err);
        return res.json({
            code: "400",
            message: "공지사항 읽기에 오류가 발생했습니다."
        });
    }

});

// 관리자: 공지사항 편집 (이미지 업로드)
router.put('/:noticeId', userUtil.LoggedIn, upload.array('images', 2), async (req,res)=> {

    const noticeId = req.params.noticeId;
    const { title, content } = req.body;
    console.log(title);

    // 0. 관리자만 편집
    if(req.job[0] != "M"){
        console.log("only manager can edit notice");
        return res.json({
            code: "202",
            message: "공지사항은 관리자만 편집할 수 있습니다."
        });
    }

    // 1. 파라미터 체크
    if(!content || !title){
        console.log("board parameter not enough");
        return res.json({
            code: "202",
            message: "필수정보가 부족합니다."
        });
    }

    let boardData = {
        title: title,
        content: content
    };

    // 2. 공지사항 수정
    await board.update(boardData, {where: {id: noticeId}})
        .then(async () => {
            console.log("success to update notice");

            // 3. 공지사항 이미지
            try {
                await board_image.destroy({where: {board_id: noticeId}});
                console.log("success to delete notice image");

                if (req.files.length > 0) {
                    for (const file of req.files) {
                        await board_image.create({
                            board_id: noticeId,
                            image_path: file.location
                        })
                    }
                }
                return res.json({
                    code: "200",
                    message: "공지사항 편집을 성공했습니다."
                });
            }
            catch(err) {
                console.log("create notibe image error", err);
                return res.json({
                    code: "400",
                    message: "공지사항 이미지 생성에 오류가 발생했습니다."
                });
            }
        })
        .catch((err) => {
            console.log("update notice error", err);
            return res.json({
                code: "400",
                message: "공지사항 편집에 오류가 발생했습니다."
            });
        })


});

// 관리자: 공지사항 삭제
router.delete('/:noticeId', userUtil.LoggedIn, async (req,res)=> {

    if(req.job[0] != "M"){
        console.log("manager can only delete notice");
        return res.json({
            code: "202",
            message: "공지사항은 관리자만 삭제할 수 있습니다."
        });
    }
    const noticeId = req.params.noticeId;
    await board.destroy({where: {id: noticeId, status: 0}})
        .then(() => {
            console.log("success to delete notice");
            return res.json({
                code: "200",
                message: "공지사항 삭제를 성공했습니다."
            });
        })
        .catch((err) => {
            console.log("delete notice error", err);
            return res.json({
                code: "400",
                message: "공지사항 삭제에 오류가 발생했습니다."
            });
        });

});

// 관리자: 공지사항 확인
router.put('/:noticeId/confirm', userUtil.LoggedIn, async (req,res)=> {

    const noticeId = req.params.noticeId;
    const commentData = {
        board_id: noticeId,
        writer_job: req.job,
        status: 0
    };

    await comment.create(commentData)
        .then(() => {
            console.log("success to confirm notice");
            return res.json({
                code: "200",
                message: "공지사항 확인을 성공했습니다."
            });
        })
        .catch((err) => {
            console.log("confirm notice error", err);
            return res.json({
                code: "400",
                message: "공지사항 확인에 오류가 발생했습니다."
            });
        });
});


module.exports = router;