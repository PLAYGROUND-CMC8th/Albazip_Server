var express = require('express');
var router = express.Router();

var voca = require('voca');
var positionUtil = require('../../module/positionUtil');
var userUtil = require('../../module/userUtil');

const models = require('../../models');

//포지션 추가하기
router.post('/',userUtil.LoggedIn, async (req,res)=> {

    const userId =  req.id;
    if(req.job[0] != 'S'){
        console.log("user is not manager");
        res.json({
            code: "202",
            message: "근무자는 포지션을 추가할 수 없습니다."
        });
        return;
    }
    const shopId = req.job.substring(1);
    const{ rank, title, startTime, endTime, workTime, breakTime } = req.body;
    let { salary, salaryType, workDays, taskLists } = req.body;


    let salary_type = {"시급": 0, "주급": 1, "월급": 2};
    salary  = voca.replaceAll(salary, ',', '');
    salary  = voca.replaceAll(salary, ' ', '');

    //1. 파라미터체크
    if(!userId || !shopId|| !rank || !title || !startTime || !endTime || !workTime || !breakTime || !workDays || !salary || !salaryType ){
        console.log("not enough parameter: ", userId, shopId, rank, title, startTime, endTime, workTime, breakTime, workDays, salary, salary_type);
        res.json({
            code: "202",
            message: "필수 정보가 부족합니다."
        });
        return;
    }

    let code = await positionUtil.makeRandomCode();
    salaryType = salary_type[salaryType];
    let workDay = workDays.join(',');

    let positionData = {
        shop_id: shopId,
        code: code,
        title: title,
        rank: rank,
        salary: salary,
        salary_type: salaryType,
        work_day: workDay,
        start_time: startTime,
        end_time: endTime,
        work_time: workTime,
        break_time: breakTime
    };

    //2. 포지션 생성
    models.sequelize.transaction(t=> {
        return models.position.create(positionData, {transaction: t})
            .then(async(newPosition) => {

                //3. 포지션 요일별 시간 생성
                for(const day of workDays){
                    if(day.length > 1)
                        continue;

                    let timeData = {
                        status: 1,
                        target_id: newPosition.id,
                        day: day,
                        start_time: startTime,
                        end_time: endTime
                    };

                    await models.time.create(timeData, {transaction: t})
                        .catch((err) => {
                            console.log("time server error: ", err);
                            res.json({
                                code: "400",
                                message:"포지션 요일별 영업시간 등록에 오류가 발생했습니다."
                            });
                            return;
                        });
                };

                //4. 포지션 업무리스트 생성
                if( taskLists ) {
                    for (const task of taskLists) {

                        if (!task.title || !task.content) {
                            console.log("not enough parameter: ");
                            res.json({
                                code: "202",
                                message: "필수 정보가 부족합니다."
                            });
                            return;
                        }

                        let taskData = {
                            shop_id: shopId,
                            writer_job: "P"+newPosition.id,
                            status: 1,
                            title: task.title,
                            content: task.content,
                            target_id: newPosition.id
                        };

                        await models.task.create(taskData, {transaction: t})
                            .catch((err) => {
                                console.log("task server error: ", err);
                                res.json({
                                    code: "400",
                                    message: "포지션 업무등록에 오류가 발생했습니다."
                                });
                                return;
                            });
                    }
                    ;
                }

            })
            .then(() => {
                console.log("success create position");
                res.json({
                    code: "200",
                    message:"성공적으로 포지션 등록을 완료했습니다."
                });
                return;
            });
            /*.catch((err) => {
                console.log("shop server error: ", err);
                res.status(400).json({
                    message:"포지션 등록에 오류가 발생했습니다."
                });
                return;
            })*/
    });
});

module.exports = router;