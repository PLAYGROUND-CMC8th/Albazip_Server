const { user, position, board, comment } = require('../models');

const pagesize = 20;

module.exports = {

    // 마이페이지 > 하단 > 작성글 > 게시글
    getPost: async (reqId, reqJob, reqPage) => {

        try {
            const offset = 0 + (reqPage - 1) * pagesize
            console.log("request post page", reqPage);

            let postData;
            try {
                postData = await board.findAll({
                    offset: offset,
                    limit: pagesize,
                    attributes: ['id', 'title', 'content', ['register_date', 'registerDate']],
                    where: {writer_job: reqJob, status: 1},
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

            let writerJob;
            if (reqJob[0] == 'S') {
                writerJob = "사장님";
                console.log("success to get writer position data");
            } else {
                try {
                    const positionData = await position.findOne({attributes: ['title'], where: {id: reqJob.substring(1)}});
                    console.log("success to get writer position data");
                    writerJob = positionData.title;
                } catch (err) {
                    console.log("get writer position data error", err);
                    writerJob = null;
                }
            }

            let writerName;
            try {
                const userData = await user.findOne({attributes: ['last_name', 'first_name'], where: {id: reqId}});
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

    // 마이페이지 > 하단 > 작성글 > 공지사항
    getNotice: async (reqJob, reqPage) => {

        const offset = 0 + (reqPage - 1) * pagesize
        console.log("request notice page",reqPage);

        try {
            const noticeData = await board.findAll({
                offset: offset,
                limit: pagesize,
                attributes: ['id', 'pin', 'title', ['register_date', 'registerDate']],
                where: {writer_job: reqJob, status: 0},
                order: [['register_date', 'DESC']]
            });
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
    }
}