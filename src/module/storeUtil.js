const requestPromise = require("request-promise");
const cheerio = require("cheerio");
const voca = require('voca');

module.exports = {

    check : async (request, response, next) => {
        const licenseNum = request.body.licenseNumber;
        const managerName =  request.body.managerName;

        let licenseNumber = voca.replaceAll(licenseNum, '-', '');

        if(licenseNumber.length != 10){
            console.log("올바른 사업자등록번호를 입력해주세요: ", licenseNum);
            return response.status(200).json({
                message:"올바른 사업자등록번호를 입력해주세요."
            });
        }

        const headers = {
            "User-Agent": "Super Agent/0.0.1",
            "Content-Type": "text/html;charset=utf-8"
        };

        const options = {
            url: "http://www.kreport.co.kr/ctcssr_a30s.do",
            method: "POST",
            headers: headers,
            form: {
                cmQuery: licenseNumber
            },
            json: true
        };

        try {
            await requestPromise(options, async (err, res, body) => {

                    if (res.statusCode === 200) {
                        console.log("Successfully request CheckLicense API: status 200");

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

                        if (bizname != managerName){
                            console.log("대표자와 사업자등록번호가 일치하지 않습니다: ", bizname, managerName);
                            return response.status(200).json({
                                message:"대표자와 사업자등록번호가 일치하지 않습니다."
                            });
                        }

                        else
                            next();
                    }
                });
        } catch (err) {
            console.error("Error requesting CheckLicense API: ",err);
            return response.status(200).json({
                message:"사업자등록번호확인 API요청을 실패했습니다."
            });
        }
    }
};