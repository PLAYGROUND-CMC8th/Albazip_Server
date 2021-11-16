var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../../module/userUtil');
var profileUtil = require('../../../module/profileUtil');
var upload = require('../../../module/multer');

const { position, shop } = require('../../../models');

const default_path = "https://albazip-bucket.s3.ap-northeast-2.amazonaws.com/default/";


// 마이페이지 > 상단 > 프로필
router.get('/', userUtil.LoggedIn, async (req,res)=> {

    const profileResult = await profileUtil.getProfile(req.id, req.job);
    return res.json(profileResult);

});

// 마이페이지 > 상단 > 프로필 > 이미지 변경
router.post('/image', userUtil.LoggedIn, upload.single('uploadImage'), async (req,res)=> {

    let imagePath;
    const { defaultImage } = req.body;

    if(req.file) {
        imagePath = req.file.location;
    } else if(defaultImage) {
        imagePath = default_path+defaultImage+".png";
    } else {
        console.log("not enough parameter");
        return res.json({
            code: "400",
            message:"올바른 이미지를 입력해주세요."
        });
    }

    if(req.job[0] == "S") {
        shop.update({image_path: imagePath}, {where: {id: req.job.substring(1)}})
            .then(() => {
                console.log("success to update manager profile image");
                return res.json({
                    code: "200",
                    message: "관리자 프로필 이미지 업데이트를 성공했습니다."
                });
            })
            .catch((err) => {
                console.log("success to update manager profile image");
                return res.json({
                    code: "200",
                    message: "관리자 프로필 이미지 업데이트를 성공했습니다."
                });
            });
    }
    else if(req.job[0] == "P") {
        position.update( {image_path: imagePath}, {where: {id: req.job.substring(1)}} )
            .then(() => {
                console.log("success to update worker profile image");
                return res.json({
                    code: "200",
                    message:"근무자 프로필 이미지 업데이트를 성공했습니다."
                });
            })
            .catch((err) => {
                console.log("success to update worker profile image");
                return res.json({
                    code: "200",
                    message: "근무자 프로필 이미지 업데이트를 성공했습니다."
                });
            });
    }
});


module.exports = router;
