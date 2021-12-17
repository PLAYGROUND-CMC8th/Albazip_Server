var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var upload = require('../../../module/multer');
var userUtil = require('../../../module/userUtil');
var boardUtil = require('../../../module/boardUtil');

const { board, board_image, comment, manager, worker, report } = require('../../../models');

// 관리자, 근무자: 게시글
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    let postResult = await boardUtil.getPost(req.job, 1);
    return res.json(postResult);

});

// 관리자, 근무자: 게시글 페이지
router.get('/page/:page', userUtil.LoggedIn, async (req,res)=> {

    const reqPage = req.params.page;
    let postResult = await boardUtil.getPost(req.job, reqPage);
    return res.json(postResult);

});

// 관리자, 근무자: 게시글 작성 (이미지 업로드)
router.post('/', userUtil.LoggedIn, upload.array('images', 2), async (req,res)=> {

    // 공지사항 작성
    const { title, content } = req.body;
    const managerData = await manager.findOne({attributes: ['shop_id'], where:{id: req.job.substring(1)}});

    // 1. 파라미터 체크
    if( !title || !content){
        console.log("board parameter not enough");
        return res.json({
            code: "202",
            message: "필수정보가 부족합니다."
        });
    }

    // 2. 매장 id
    let shopId;
    try {
        if (req.job[0] == "M") {
            let managerData = await manager.findOne({attributes: ['shop_id'], where: {id: req.job.substring(1)}});
            shopId = managerData.shop_id
        } else if (req.job[0] == "W") {
            let workerData = await worker.findOne({attributes: ['position_id'], where: {id: req.job.substring(1)}});
            let positionData = await position.findOne({
                attributes: ['shop_id'],
                where: {id: workerData.position_id}
            });
            shopId = positionData.shop_id;
        }
        console.log("success to get shop id");
    }
    catch(err) {
        console.log("get shop id error", err);
        return res.json({
            code: "400",
            message: "매장 정보 조회시 오류가 발생했습니다."
        });
    }

    let boardData = {
        shop_id: shopId,
        writer_job: req.job,
        pin: 0,
        status: 1,
        title: title,
        content: content
    };

    // 3. 게시글 생성
    await board.create(boardData)
        .then(async (newBoard) => {
            console.log("success to create post");

            // 4. 공지사항 이미지 생성
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
                    message: "게시글 생성을 성공했습니다."
                });
            }
            catch(err) {
                console.log("create notibe image error", err);
                return res.json({
                    code: "400",
                    message: "게시글 이미지 생성에 오류가 발생했습니다."
                });
            }
        })
        .catch((err) => {
            console.log("create notice error", err);
            return res.json({
                code: "400",
                message: "게시글 생성에 오류가 발생했습니다."
            });
        })

});

// 관리자, 근무자: 게시글 검색 (body)
router.get('/search', userUtil.LoggedIn, async (req,res)=> {

    const searchWord = req.body.searchWord;
    const searchPostResult = await boardUtil.searchPost(req.job, 1, searchWord);
    return res.json(searchPostResult);

});

// 관리자, 근무자: 게시글 검색 (url)
router.get('/search/word/:searchWord', userUtil.LoggedIn, async (req,res)=> {

    const searchWord = req.params.searchWord;
    const searchPostResult = await boardUtil.searchPost(req.job, 1, searchWord);
    return res.json(searchPostResult);

});

// 관리자, 근무자: 게시글 검색 페이지 (body)
router.get('/search/:page', userUtil.LoggedIn, async (req,res)=> {

    const reqPage = req.params.page;
    const searchWord = req.body.searchWord;
    const searchPostResult = await boardUtil.searchPost(req.job, reqPage, searchWord);
    return res.json(searchPostResult);

});

// 관리자, 근무자: 게시글 검색 페이지 (url)
router.get('/search/word/:searchWord/:page', userUtil.LoggedIn, async (req,res)=> {

    const reqPage = req.params.page;
    const searchWord = req.params.searchWord;
    const searchPostResult = await boardUtil.searchPost(req.job, reqPage, searchWord);
    return res.json(searchPostResult);

});

// 관리자, 근무자: 게시글 읽기
router.get('/:postId', userUtil.LoggedIn, async (req,res)=> {

    try {
        const postId = req.params.postId;
        const boardData = await board.findOne({where: {id: postId}});
        if(!boardData){
            console.log("no post exist");
            return res.json({
                code: "202",
                message: "게시글이 존재하지 않습니다."
            });
        }

        const boardImageData = await board_image.findAll({
            attributes: ['id', 'image_path'],
            where: {board_id: postId}
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
            writerTitle = "퇴사자";
            writerName = "이름없음";
            writerImage = "https://albazip-bucket.s3.ap-northeast-2.amazonaws.com/default/n1.png";
        }

        // 댓글

        console.log("success to get a post data");
        let boardInfo = {
            writerInfo: {
                title: writerTitle,
                name: writerName,
                image: writerImage,
                isMe: boardData.writer_job == req.job ? 1: 0
            },
            boardInfo: {
                title: boardData.title,
                content: boardData.content,
                registerDate: boardData.register_date,
                image: boardImageData
            }
            //commentInfo: {}
        };
        return res.json({
            code: "200",
            message: "게시글 읽기를 성공했습니다.",
            data: boardInfo
        });
    }
    catch(err) {
        console.log("get a post data error", err);
        return res.json({
            code: "400",
            message: "게시글 읽기에 오류가 발생했습니다."
        });
    }

});

// 관리자, 근무자: 게시글 편집 (이미지 업로드)
router.put('/:postId', userUtil.LoggedIn, upload.array('images', 2), async (req,res)=> {

    const postId = req.params.postId;
    const { title, content } = req.body;

    // 1. 파라미터 체크
    if(!title || !content){
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
    await board.update(boardData, {where: {id: postId}})
        .then(async () => {
            console.log("success to update post");

            // 3. 공지사항 이미지
            try {
                await board_image.destroy({where: {board_id: postId}});
                console.log("success to delete post image");

                if (req.files.length > 0) {
                    for (const file of req.files) {
                        await board_image.create({
                            board_id: postId,
                            image_path: file.location
                        })
                    }
                }
                return res.json({
                    code: "200",
                    message: "게시글 편집을 성공했습니다."
                });
            }
            catch(err) {
                console.log("create post image error", err);
                return res.json({
                    code: "400",
                    message: "게시글 이미지 생성에 오류가 발생했습니다."
                });
            }
        })
        .catch((err) => {
            console.log("update post error", err);
            return res.json({
                code: "400",
                message: "게시글 편집에 오류가 발생했습니다."
            });
        })


});

// 관리자, 근무자: 게시글 삭제
router.delete('/:postId', userUtil.LoggedIn, async (req,res)=> {

    const postId = req.params.postId;
    const postData = await board.findOne({attributes: ['writer_job'], where: {id: postId}});

    if(req.job != postData.writer_job){
        console.log("writer can only delete post");
        return res.json({
            code: "202",
            message: "공지사항은 작성자만 삭제할 수 있습니다."
        });
    }

    await board.destroy({where: {id: postId, status: 1}})
        .then(() => {
            console.log("success to delete post");
            return res.json({
                code: "200",
                message: "게시글 삭제를 성공했습니다."
            });
        })
        .catch((err) => {
            console.log("delete post error", err);
            return res.json({
                code: "400",
                message: "게시글 삭제에 오류가 발생했습니다."
            });
        });

});


module.exports = router;