const businessVerifyApiKey = require('../config/businessVerifyApiKey.json');

const requestPromise = require("request-promise");
const cheerio = require("cheerio");
const voca = require('voca');

const { shop, time } = require('../models');

const headers = {
    "User-Agent": "Super Agent/0.0.1",
    "Content-Type": "text/html;charset=utf-8"
};

// K-repot 사업자인증번호 검색 크롤링 API
let options = {
    url: "http://www.kreport.co.kr/ctcssr_a30s.do",
    method: "POST",
    headers: headers,
    form: {
        cmQuery: ""
    },
    json: true
};

let option = {
    url: `http://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${businessVerifyApiKey.encoding}`,
    method: "POST",
    body: {
        b_no: ""
    },
    json: true
}

module.exports = {
    // 매장 생성 전 유효성 검사
    beforeRegister: async (req, res, next) => {
        let {name, ownerName, registerNumber, holiday, openSchedule} = req.body;
        const {type, address, payday } = req.body;

        registerNumber = voca.replaceAll(registerNumber, "-", "");

        //1. 파라미터체크
        if(!name || !type || !address || !registerNumber || !holiday || !payday || !openSchedule){
            console.log("not enough parameter ");
            res.json({
                code: "202",
                message: "매장등록에 필수 정보가 부족합니다."
            });
        }

        //2. 매장 중복체크 (매장명, 매장사업자등록번호)
        try {
            await shop.count({where: { name: name }})
                .then(count => {
                    console.log("shop name count:" + count);
                    if(count > 0 ){
                        console.log(name + "is already exist");
                        throw err;
                    }
                });

            await shop.count({where: { register_number : registerNumber }})
                .then(count => {
                    console.log("shop register number count:" + count);
                    if(count > 0 ) {
                        console.log("register number is already exist");
                        throw err;
                    }
                });
            next();

        }catch (err) {
            if(err){
                console.error("error shop server : ",err);
                res.json({
                    code: "202",
                    message:"이미 존재하는 매장입니다."
                })
            }
        }
    },

    // 사업자 등록번호 존재여부 : 
    checkRegisterNumber: async (request, response, next) => {
        const registerNum = request.params.registerNumber;
        let registerNumber = voca.replaceAll(registerNum, '-', '');

        // 사업자번호 유효성체크
        if(registerNumber.length != 10){
            console.log("not enough register number: ", registerNumber);
            return response.json({
                code: "202",
                message:"올바른 사업자등록번호를 입력해주세요."
            });
        }

        // 중복체크
        try{
        await shop.count({where: { register_number : registerNumber }})
        .then(count => {
            console.log("shop register number count:" + count);
            if(count > 0 ) {
                console.log("register number is already exist");
                throw err;
            }
        });
        }catch (err) {
            if(err){
                console.error("error shop server : ",err);
                return response.json({
                    code: "202",
                    message:"이미 존재하는 매장입니다."
                });
            }
        }

        // 신) 사업자 인증번호 인증 로직
        // 사업자 등록번호 존재여부
        try {
            option.body.b_no = [registerNumber];
            console.log(option);
            await requestPromise(option, async (err, res, body) => {

                if (res.statusCode === 200) {
                    console.log("request shop register number server success");

                    if (!body["match_cnt"] || body["match_cnt"] < 0){
                        console.log("no such register number: ", registerNumber);
                        return response.json({
                            code: "202",
                            message:"등록되지 않은 번호입니다."
                        });
                    }
                    else
                        next();
                }
            });
        } catch (err) {
            console.error("error shop register number server : ",err);
            return response.json({
                code: "400",
                message:"사업자등록번호확인 API요청을 실패했습니다."
            });
        }

    },

    // 구) 사업자 인증번호 인증 로직
    // K-report 사업자등록번호 크롤링 모듈
    // 사업자 등록번호와 대표자 인증여부
    checkOwnerName : async (request, response, next) => {
        const registerNum = request.params.registerNumber;
        const ownerName =  request.params.ownerName;

        let registerNumber = voca.replaceAll(registerNum, '-', '');

        if(registerNumber.length != 10){
            console.log("not enough register number: ", registerNumber);
            return response.json({
                code: "202",
                message:"올바른 사업자등록번호를 입력해주세요."
            });
        }

        try {
            options.form.cmQuery = registerNumber;
            await requestPromise(options, async (err, res, body) => {

                    if (res.statusCode === 200) {
                        console.log("request shop register number server success");

                        const $ = cheerio.load(body);
                        const bizlist = $(".bizlist");
                        const bizinfo = bizlist.children().eq(0);

                        let bizname = bizinfo.text();
                        bizname = voca.replaceAll(bizname, '\t', '');
                        bizname = voca.replaceAll(bizname, '\r\n', '');
                        bizname = voca.trim(bizname);

                        const s = bizname.indexOf("(대표자:");
                        const e = bizname.indexOf(")", s);
                        bizname = bizname.substring(s + 5, e);
                        bizname = voca.replaceAll(bizname, " ", "");

                        if (bizname != ownerName){
                            console.log("owner name doesn't matched with it: ", bizname, ownerName);
                            return response.json({
                                code: "202",
                                message:"대표자와 사업자등록번호가 일치하지 않습니다."
                            });
                        }

                        else
                            next();
                    }
                });
        } catch (err) {
            console.error("error shop register number server : ",err);
            return response.json({
                code: "400",
                message:"사업자등록번호확인 API요청을 실패했습니다."
            });
        }
    },

    // 매장 영업시간 리스트 
    getShopTime: async (shopId) => {

        try {
            const timeData = await time.findAll({
                attributes:[['start_time', 'startTime'], ['end_time', 'endTime'], 'day' ],
                where: {status:0, target_id: shopId}});

            console.log("success to get shop time data");

            return {
                code: "200",
                message: "매장 영업시간 조회를 성공했습니다.",
                data: timeData
            };
        }
        catch(err) {
            console.log("get shop time data error", err);
            return {
                code: "400",
                message: "매장 영업시간 조회에 오류가 발생했습니다."
            };
        }
    }

    // 매장 삭제
};