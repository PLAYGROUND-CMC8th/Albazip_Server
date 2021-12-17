const { user, position, board, board_image, comment, worker, manager } = require('../models');

const pagesize = 20;

module.exports = {
    // 소통창 > 게시글
    getPost: async  (reqJob, reqPage) => {

        try {
            const offset = 0 + (reqPage - 1) * pagesize
            console.log("request post page", reqPage);

            let shopId;
            if (reqJob[0] == "M") {
                let managerData = await manager.findOne({attributes: ['shop_id'], where: {id: reqJob.substring(1)}});
                shopId = managerData.shop_id
            } else if (reqJob[0] == "W") {
                let workerData = await worker.findOne({attributes: ['position_id'], where: {id: reqJob.substring(1)}});
                let positionData = await position.findOne({
                    attributes: ['shop_id'],
                    where: {id: workerData.position_id}
                });
                shopId = positionData.shop_id;
            }

            let postData;
            try {
                postData = await board.findAll({
                    offset: offset,
                    limit: pagesize,
                    attributes: ['id', 'title', 'content', 'writer_job', 'register_date'],
                    where: {status: 1, shop_id: shopId},
                    order: [['register_date', 'DESC']]
                });
                console.log("success to get recent post");
            } catch (err) {
                console.log("get recent post error", err);
                return result = {
                    code: "400",
                    message: "게시글 조회에 오류가 발생했습니다.",
                };
            }

            let postInfo = [];
            if (postData) {
                for (const pdata of postData) {

                    // 작성자
                    let writerJob, writerName, writerImage;
                    if (pdata.writer_job[0] == 'M') {
                        let managerData = await manager.findOne({where: {id: pdata.writer_job.substring(1)}});
                        writerJob = "사장님";
                        writerName = managerData.user_last_name + managerData.user_first_name;
                        writerImage = managerData.image_path;

                    } else {
                        try {
                            let workerData = await worker.findOne({where: {id: pdata.writer_job.substring(1)}});
                            writerJob = workerData.position_title;
                            writerName = workerData.user_first_name;
                            writerImage = workerData.image_path;

                        } catch (err) {
                            writerJob = "퇴사자";
                            writerName = "이름없음";
                            writerImage = "https://albazip-bucket.s3.ap-northeast-2.amazonaws.com/default/n1.png";
                        }
                    }
                    //console.log("success to get writer data");

                    // 게시글 이미지
                    let image;
                    try {
                        let boardImageData = await board_image.findOne({where: {board_id: pdata.id}});
                        image = boardImageData.image_paht;
                    } catch (err) {
                        image = null;
                    }

                    // 24시간 이내
                    let in24Hour = 0;
                    const nowTime = new Date();
                    const writeTime = new Date(pdata.register_date);
                    const passTime = parseInt(nowTime.getTime() - writeTime.getTime());
                    const passHour = Math.round(passTime / (1000 * 60 * 60)) - 1;
                    const passMin = Math.round(passTime / (1000 * 60));
                    if (passHour < 24) in24Hour = 1;

                    // 댓글수
                    /* let commentCount;
                   try {
                       let count = await comment.count({where: {status: [1, 2], board_id: pdata.id}});
                       commentCount = count;
                       console.log("success to get comment count data");

                   } catch (err) {
                       commentCount = 0;
                       console.log("get comment count data error", err);
                   }*/

                    let data = {
                        id: pdata.id,
                        writerJob: writerJob,
                        writerName: writerName,
                        writerImage: writerImage,
                        title: pdata.title,
                        content: pdata.content,
                        image: image,
                        //commentCount: commentCount,
                        writeIn24Hour: in24Hour,
                        writeInTime: passHour == 0 ? passMin+"분" : passHour+"시간",
                        writeDate: pdata.register_date
                    }
                    postInfo.push(data);
                }
            }
            console.log("success to get post data");
            return {
                code: "200",
                message: "게시글 조회에 성공했습니다.",
                page: reqPage,
                data: postInfo
            };
        }
        catch (err) {
            console.log("get post data error", err);
            return {
                code: "400",
                message: "게시글 조회에 오류가 발생했습니다."
            };
        }

    },

    // 마이페이지 > 하단 > 작성글 > 게시글
    getMyPost: async (reqJob, reqPage) => {

        try {
            const offset = 0 + (reqPage - 1) * pagesize
            console.log("request post page", reqPage);

            let shopId;
            if(reqJob[0] == "M"){
                let managerData = await manager.findOne({attributes:['shop_id'], where: {id: reqJob.substring(1)}});
                shopId = managerData.shop_id
            } else  if(reqJob[0] == "W") {
                let workerData = await worker.findOne({attributes:['position_id'], where: {id: reqJob.substring(1)}});
                let positionData = await position.findOne({attributes:['shop_id'], where: {id: workerData.position_id}});
                shopId = positionData.shop_id;
            }

            let postData;
            try {
                postData = await board.findAll({
                    offset: offset,
                    limit: pagesize,
                    attributes: ['id', 'title', 'content', 'register_date'],
                    where: {writer_job: reqJob, status: 1, shop_id: shopId},
                    order: [['register_date', 'DESC']]
                });
                console.log("success to get recent post");

            } catch (err) {
                console.log("get recent post error", err);
                return result = {
                    code: "400",
                    message: "게시글 조회에 오류가 발생했습니다.",
                };
            }

            let writerJob, writerName, wirterImage;
            if (reqJob[0] == 'M') {
                let managerData = await manager.findOne({where: {id: reqJob.substring(1)}});
                writerJob = "사장님";
                writerName = managerData.user_last_name + managerData.user_first_name;
                wirterImage = managerData.image_path;

            } else if (reqJob[0] == 'W') {
                let workerData = await worker.findOne({where: {id: reqJob.substring(1)}});
                writerJob = workerData.position_title;
                writerName = workerData.user_first_name;
                wirterImage = workerData.image_path;

            }
            //console.log("success to get writer data");

            let postInfo = [];
            if (postData) {
                for (const pdata of postData) {

                    // 게시글 이미지
                    let image;
                    try {
                        let boardImageData = await board_image.findOne({where: {board_id: pdata.id}});
                        image = boardImageData.image_paht;
                    } catch (err) {
                        image = null;
                    }

                   /* let commentCount;
                    try {
                        let count = await comment.count({where: {status: [1, 2], board_id: pdata.id}});
                        commentCount = count;
                        console.log("success to get comment count data");

                    } catch (err) {
                        commentCount = 0;
                        console.log("get comment count data error", err);
                    }*/

                    let data = {
                        id: pdata.id,
                        writerJob: writerJob,
                        writerName: writerName,
                        writerImage: wirterImage,
                        title: pdata.title,
                        content: pdata.content,
                        image: image,
                        //commentCount: commentCount,
                        registerDate: pdata.register_date
                    }
                    postInfo.push(data);
                }
            }

            console.log("success to get mypage post");
            return {
                code: "200",
                message: "마이페이지 게시글 조회에 성공했습니다. ",
                page: reqPage,
                data: postInfo
            };
        }
        catch (err){
            console.log("get mypage post error");
             return {
                code: "400",
                message: "마이페이지 게시글 조회에 오류가 발생했습니다. ",
            };
        }

    },


    // 소통창 > 공지사항
    getNotice: async (reqJob, reqPage, confirm) => {

        const offset = 0 + (reqPage - 1) * pagesize
        console.log("request notice page",reqPage);

        try {
            let noticeData;
            if(confirm == 0) {
                const managerData = await manager.findOne({attributes:['shop_id'], where: {id: reqJob.substring(1)}});

                noticeData = await board.findAll({
                    offset: offset,
                    limit: pagesize,
                    attributes: ['id', 'pin', 'title', ['register_date', 'registerDate']],
                    where: {status: 0, shop_id: managerData.shop_id},
                    order: [['pin', 'DESC'], ['register_date', 'DESC']]
                });

            } else {
                const workerData = await worker.findOne({attributes:['position_id'], where: {id: reqJob.substring(1)}});
                const positionData = await position.findOne({attributes:['shop_id'], where: {id: workerData.position_id}});

                noticeData = await board.findAll({
                    offset: offset,
                    limit: pagesize,
                    attributes: ['id', 'pin', 'title', ['register_date', 'registerDate']],
                    where: { status: 0, shop_id: positionData.shop_id},
                    order: [['pin', 'DESC'], ['register_date', 'DESC']]
                });

                console.log("success to get recent notice");

                if(noticeData.length > 0){
                    for(let ndata of noticeData){
                        let confirmCount = await comment.count({
                            where: {
                                writer_job: reqJob,
                                status: 0,
                                board_id: ndata.id
                            }
                        });
                        if(confirmCount > 0)
                            ndata.dataValues.confirm = 1;
                        else ndata.dataValues.confirm = 0;
                    }
                }
            }

            console.log("success to get notice data");
            return {
                code: "200",
                message: "공지사항 조회에 성공했습니다.",
                page: reqPage,
                data: noticeData
            };
        }
        catch(err) {
            console.log("get recent notice error", err);
            return {
                code: "400",
                message: "공지사항 조회에 오류가 발생했습니다.",
            };
        }
    },

    // 마이페이지 > 하단 > 작성글 > 공지사항
    getMyNotice: async (reqJob, reqPage) => {

        const offset = 0 + (reqPage - 1) * pagesize
        console.log("request notice page",reqPage);

        try {
            const managerData = await manager.findOne({attributes:['shop_id'], where: {id: reqJob.substring(1)}});

            const noticeData = await board.findAll({
                offset: offset,
                limit: pagesize,
                attributes: ['id', 'pin', 'title', ['register_date', 'registerDate']],
                where: {writer_job: reqJob, status: 0, shop_id: managerData.shop_id},
                order: [['register_date', 'DESC']]
            });

            console.log("success to get recent notice");
            return {
                code: "200",
                message: "작성글 공지사항 조회에 성공했습니다.",
                page: reqPage,
                data: noticeData
            };
        }
        catch(err) {
            console.log("get recent notice error", err);
            return {
                code: "400",
                message: "작성글 공지사항 조회에 오류가 발생했습니다.",
            };
        }
    },

    //소통창 > 검색 > 공지사항
    searchNotice: async (reqJob, reqPage, searchWord) => {

        try {
            const offset = 0 + (reqPage - 1) * pagesize
            console.log("request post page", reqPage);

            let shopId;
            if (reqJob[0] == "M") {
                let managerData = await manager.findOne({attributes: ['shop_id'], where: {id: reqJob.substring(1)}});
                shopId = managerData.shop_id
            } else if (reqJob[0] == "W") {
                let workerData = await worker.findOne({attributes: ['position_id'], where: {id: reqJob.substring(1)}});
                let positionData = await position.findOne({
                    attributes: ['shop_id'],
                    where: {id: workerData.position_id}
                });
                shopId = positionData.shop_id;
            }

            // 검색여부
            const query = `select id, pin, title, register_date as registerDate
                       from board
                       where status = 0
                       and shop_id = ${shopId}
                       and (content like "%${searchWord}%" or title like "%${searchWord}%")
                       order by register_date desc
                       limit ${pagesize}
                       offset ${offset}`;

            const noticeData = await board.sequelize.query(query, {type: sequelize.QueryTypes.SELECT});

            // 검색결과 확인
            for(let ndata of noticeData) {
                let count = await comment.count({where: {board_id: ndata.id, status: 0, writer_job: reqJob}});
                if (count > 0)
                    ndata.confirm = 1;
                else
                    ndata.confirm = 0;
            }

            console.log("success to get notice board");
            return {
                code: "200",
                message: "공지사항 검색에 성공했습니다.",
                page: reqPage,
                data: noticeData,
                req: {
                    searchWord: searchWord
                }
            };
        }
        catch(err) {
            console.log("get search notice error", err);
            return {
                code: "400",
                message: "공지사항 검색에 오류가 발생했습니다.",
                page: reqPage
            };
        }
    },

    //소통창 > 검색 > 게시글
    searchPost: async (reqJob, reqPage, searchWord) => {

        try {
            const offset = 0 + (reqPage - 1) * pagesize
            console.log("request post page", reqPage);

            let shopId;
            if (reqJob[0] == "M") {
                let managerData = await manager.findOne({attributes: ['shop_id'], where: {id: reqJob.substring(1)}});
                shopId = managerData.shop_id
            } else if (reqJob[0] == "W") {
                let workerData = await worker.findOne({attributes: ['position_id'], where: {id: reqJob.substring(1)}});
                let positionData = await position.findOne({
                    attributes: ['shop_id'],
                    where: {id: workerData.position_id}
                });
                shopId = positionData.shop_id;
            }

            // 검색여부
            const query = `select id, title, content, writer_job, register_date
                       from board
                       where status = 1
                       and shop_id = ${shopId}
                       and (content like "%${searchWord}%" or title like "%${searchWord}%")
                       order by register_date desc
                       limit ${pagesize}
                       offset ${offset}`;

            const postData = await board.sequelize.query(query, {type: sequelize.QueryTypes.SELECT});

            let postInfo = [];
            if (postData) {
                for (const pdata of postData) {

                    // 작성자
                    let writerJob, writerName, writerImage;
                    if (pdata.writer_job[0] == 'M') {
                        let managerData = await manager.findOne({where: {id: pdata.writer_job.substring(1)}});
                        writerJob = "사장님";
                        writerName = managerData.user_last_name + managerData.user_first_name;
                        writerImage = managerData.image_path;

                    } else {
                        try {
                            let workerData = await worker.findOne({where: {id: pdata.writer_job.substring(1)}});
                            writerJob = workerData.position_title;
                            writerName = workerData.user_first_name;
                            writerImage = workerData.image_path;

                        } catch (err) {
                            writerJob = "퇴사자";
                            writerName = "이름없음";
                            writerImage = null;
                        }
                    }
                    //console.log("success to get writer data");

                    // 게시글 이미지
                    let image;
                    try {
                        let boardImageData = await board_image.findOne({where: {board_id: pdata.id}});
                        image = boardImageData.image_paht;
                    } catch (err) {
                        image = null;
                    }

                    // 24시간 이내

                    // 댓글수
                    /* let commentCount;
                   try {
                       let count = await comment.count({where: {status: [1, 2], board_id: pdata.id}});
                       commentCount = count;
                       console.log("success to get comment count data");

                   } catch (err) {
                       commentCount = 0;
                       console.log("get comment count data error", err);
                   }*/

                    let data = {
                        id: pdata.id,
                        writerJob: writerJob,
                        writerName: writerName,
                        writerImage: writerImage,
                        title: pdata.title,
                        content: pdata.content,
                        image: image,
                        //commentCount: commentCount,
                        //writeIn24Hour: in24Hour,
                        //writeInHour: passHour,
                        writeDate: pdata.register_date
                    }
                    postInfo.push(data);
                }
            }

            console.log("success to get search post");
            return {
                code: "200",
                message: "게시글 검색에 성공했습니다.",
                page: reqPage,
                data: postInfo,
                req: {
                    searchWord: searchWord
                }
            };
        }
        catch(err) {
            console.log("get search post error", err);
            return {
                code: "400",
                message: "게시글 검색에 오류가 발생했습니다.",
                page: reqPage
            };
        }
    }
}