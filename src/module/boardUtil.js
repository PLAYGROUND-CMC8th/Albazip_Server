const { user, position, board, comment, worker, manager } = require('../models');

const pagesize = 20;

module.exports = {

    // 마이페이지 > 하단 > 작성글 > 게시글
    getPost: async (reqJob, reqPage) => {

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
                if(reqJob) {
                    postData = await board.findAll({
                        offset: offset,
                        limit: pagesize,
                        attributes: ['id', 'title', 'content', 'register_date'],
                        where: {writer_job: reqJob, status: 1, shop_id: shopId},
                        order: [['register_date', 'DESC']]
                    });
                } else {
                    postData = await board.findAll({
                        offset: offset,
                        limit: pagesize,
                        attributes: ['id', 'title', 'content', 'writer_job', 'register_date'],
                        where: {status: 1, shop_id: shopId},
                        order: [['register_date', 'DESC']]
                    });
                }
                console.log("success to get recent post");

            } catch (err) {
                console.log("get recent post error", err);
                return result = {
                    code: "400",
                    message: "게시글 조회에 오류가 발생했습니다.",
                };
            }

            let writerJob, writerName;
            if(reqJob) {
                if (reqJob[0] == 'M') {
                    let managerData = await manager.findOne({where: {id: reqJob.substring(1)}});
                    writerJob = "사장님";
                    writerName = managerData.user_last_name + managerData.user_first_name;

                } else {
                    try {
                        let workerData = await worker.findOne({where: {id: reqJob.substring(1)}});
                        writerJob = workerData.position_title;
                        writerName = workerData.user_first_name;

                    } catch (err) {
                        writerJob = null;
                        writerName = null;
                    }
                }
                console.log("success to get writer data");
            }


            let postInfo = [];
            if (postData) {
                for (const pdata of postData) {

                    let commentCount;
                    try {
                        let count = await comment.count({where: {status: [1, 2], board_id: pdata.id}});
                        commentCount = count;
                        console.log("success to get comment count data");

                    } catch (err) {
                        commentCount = 0;
                        console.log("get comment count data error", err);
                    }

                    if(!reqJob){
                        if (pdata.writer_job[0] == 'M') {
                            let managerData = await manager.findOne({where: {id: reqJob.substring(1)}});
                            writerJob = "사장님";
                            writerName = managerData.user_last_name + managerData.user_first_name;

                        } else {
                            try {
                                let workerData = await worker.findOne({where: {id: reqJob.substring(1)}});
                                writerJob = workerData.position_title;
                                writerName = workerData.user_first_name;

                            } catch (err) {
                                writerJob = null;
                                writerName = null;
                            }
                        }
                    }

                    let data = {
                        id: pdata.id,
                        writerJob: writerJob,
                        writerName: writerName,
                        title: pdata.title,
                        content: pdata.content,
                        commentCount: commentCount,
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

    // 홈 > 하단 > 소통창
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

            console.log("success to get recent notice");
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

            console.log("success to get search board");
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
            console.log("get search board error", err);
            return {
                code: "400",
                message: "공지사항 검색에 오류가 발생했습니다.",
                page: reqPage
            };
        }
    }
}