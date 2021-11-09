const { position, user, manager, worker, shop } = require('../models');


module.exports = {

    getProfile: async(reqId, reqJob) => {

        try {
            let jobData, positionData, shopData;
            const userData = await user.findOne({where: {id: reqId}});
            if(reqJob[0] == 'S'){
                jobData = await manager.findOne({where: {shop_id: reqJob.substring(1)}});
                shopData = await shop.findOne({attributes: [ 'image_path' ], where: {id: reqJob.substring(1)}});

            } else {
                jobData = await worker.findOne({where: {position_id: reqJob.substring(1)}});
                positionData = await position.findOne({attributes: [ 'image_path' ], where: {id: reqJob.substring(1)}});
            }

            const profileData = {
                shopName: jobData.shop_name,
                jobTitle: reqJob[0] == 'S'? "사장님": jobData.position_title,
                lastName: userData.last_name,
                firstName: userData.first_name,
                imagePath: reqJob[0] == 'S'? shopData.image_path: positionData.image_path
            }

            console.log("success get mypage profile");
            return {
                code: "200",
                message: "프로필 조회를 성공했습니다.",
                data: profileData
            };
        }

        catch(err) {
            console.log("get mypage profile error", err);
            return {
                code: "400",
                message: "프로필 정보 조회시 오류가 발생했습니다."
            }
        }
    }

};