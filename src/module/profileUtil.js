const { position, user, manager, worker, shop } = require('../models');


module.exports = {
    // 마이페이지 > 상단 > 프로필 조회
    getProfile: async(reqJob) => {

        try {
            
            let jobData;
            if(reqJob[0] == 'M'){
                jobData = await manager.findOne({where: {id: reqJob.substring(1)}});
            } else if(reqJob[0] == 'W'){
                jobData = await worker.findOne({where: {id: reqJob.substring(1)}});
            }

            const profileData = {
                shopName: jobData.shop_name,
                jobTitle: reqJob[0] == 'M'? "사장님": jobData.position_title,
                lastName: reqJob[0] == 'M'? jobData.user_last_name: "",
                firstName: jobData.user_first_name,
                imagePath: jobData.image_path
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