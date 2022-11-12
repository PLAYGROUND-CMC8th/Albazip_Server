var express = require('express');
var router = express.Router();

const publicHolidayApiKey = require('../../config/publicHolidayApiKey');
const holidays = require('holidays-kr');
const sequelize = require('sequelize');
const qrcode = require('qrcode');

var userUtil = require('../../module/userUtil');
var timeUtil = require('../../module/timeUtil');
var pushAlarm = require('../../module/pushAlarm');
var scheduleUtil = require('../../module/scheduleUtil');
var taskUtil = require('../../module/taskUtil');

const { manager, worker, shop, position, board, schedule, comment, time } = require('../../models');

// 오늘의 날짜
/*const now = new Date();
const yearNow = now.getFullYear();
const monthNow = now.getMonth()+1;
const dateNow = now.getDate();
const dayNow = now.getDay();
const hourNow = String(now.getHours()).padStart(2, '0');
const minNow = String(now.getMinutes()).padStart(2, '0');*/
const weekdays = [ '일', '월', '화', '수', '목', '금', '토'];

// 관리자: 홈
router.get('/manager', userUtil.LoggedIn, async (req,res)=>{

    try {

        // 오늘의 날짜
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth()+1;
        const dateNow = now.getDate();
        const dayNow = now.getDay();
        const hourNow = String(now.getHours()).padStart(2, '0');
        const minNow = String(now.getMinutes()).padStart(2, '0');

        let totalData = {};

        const managerData = await manager.findOne({attributes: ['shop_id'], where: {id: req.job.substring(1)}});
        const shopData = await shop.findOne({where: {id: managerData.shop_id}});
        const timeData = await time.findOne({attributes: ['start_time', 'end_time'], where: {status: 0, target_id: managerData.shop_id, day: weekdays[dayNow]}});

        const todayInfo = {
            month: monthNow,
            date: dateNow,
            day: weekdays[dayNow]
        }
        totalData.todayInfo = todayInfo;

        // 매장 정보
        const shopInfo = {
            status: 0, // 0 : 영업 전, 1: 영업 중, 2: 영업 후, 3: 휴무
            name: shopData.name,
            startTime: timeData ? timeData.start_time : null,
            endTime: timeData ? timeData.end_time : null
        };
        totalData.shopInfo = shopInfo;

        // 공휴일 유무에 따라 shopInfo의 status 결정
        holidays.serviceKey = publicHolidayApiKey.encoding;
        holidays.serviceKey = publicHolidayApiKey.encoding;
        const holidayResult = await holidays.getHolidays({
            year: yearNow,           // 수집 시작 연도
            month: monthNow,         // 수집 시작 월
            monthCount: 1            // 수집 월 갯수
        });

        let publicHolidays = [];
        for(const holiday of holidayResult)
            publicHolidays.push(holiday.month + "/" +holiday.day)

        if(publicHolidays.includes(monthNow+"/"+dateNow) || shopData.holiday.includes(weekdays[dayNow]))
            shopInfo.status = 3;

        if((parseInt(hourNow) > parseInt(timeData.start_time.substring(0,2)))
            || (hourNow == timeData.start_time.substring(0,2) && parseInt(minNow) >= parseInt(timeData.start_time.substring(2,4))))
            shopInfo.status = 1;

        if((parseInt(hourNow) > parseInt(timeData.end_time.substring(0,2)))
            || (hourNow == timeData.end_time.substring(0,2) && parseInt(minNow) > parseInt(timeData.end_time.substring(2,4))))
            shopInfo.status = 2;

        if(timeData.start_time && timeData.end_time && timeData.start_time == timeData.end_time)
            shopInfo.status = 1;

        if(shopInfo.status != 3) {

            // 오늘 근무자
            let workers = [];

            const scheduleData = await schedule.findAll({
                attributes: ['worker_id'],
                where: {shop_id: shopData.id, year: yearNow, month: monthNow, day: dateNow}
            });

            for (const sdata of scheduleData) {
                let workerData = await worker.findOne({
                    attributes: [['position_title', 'title'], ['user_first_name', 'firstName']],
                    where: {id: sdata.worker_id}
                });
                if(workerData) {
                    workerData.dataValues.title = workerData.dataValues.title.substring(2);
                    workers.push(workerData);
                }
            }

            totalData.workerInfo = workers;

            // 오늘 업무
            totalData.taskInfo = await taskUtil.getTodayTaskCount(shopData.id, null);

        }

        // 소통창
        const boardData = await board.findAll({
            limit: 4,
            attributes: ['status', 'id', 'title'],
            where: {shop_id: shopData.id, status: 0}, // 추후에 소통창까지
            order: [['register_date', 'DESC']]
        });
        totalData.boardInfo = boardData;

        console.log("success to get manager home page");
        res.json({
            code: "200",
            message: "관리자 홈화면 조회를 성공했습니다.",
            data: totalData
        });
        return;
    }
    catch(err) {
        console.log("get manager home page error", err);
        res.json({
            code: "400",
            message: "관리자 홈화면 조회에 오류가 발생했습니다."
        });
        return;
    }

});

// 근무자: 홈
router.get('/worker', userUtil.LoggedIn, async (req,res)=> {
    try {
        let totalData = {};

        // 오늘의 날짜
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth()+1;
        const dateNow = now.getDate();
        const dayNow = now.getDay();
        const hourNow = String(now.getHours()).padStart(2, '0');
        const minNow = String(now.getMinutes()).padStart(2, '0');

        const todayInfo = {
            month: monthNow,
            date: dateNow,
            day: weekdays[dayNow]
        }
        totalData.todayInfo = todayInfo;

        // 매장 정보
        const workerData = await worker.findOne({
            attributes: ['id', 'position_id', 'shop_name', 'position_title'],
            where: {id: req.job.substring(1)}
        });
        const positionData = await position.findOne({attributes: ['shop_id'], where:{id: workerData.position_id }});

        let shopInfo = {
            status: 3, // 0 : 근무 전, 1: 근무 중, 2: 근무 후, 3: 휴무
            shopName: workerData.shop_name
        };

        let scheduledData;
        try {
            // 근무자 스케줄 정보
            scheduledData = await schedule.findOne({
                attributes: ['start_time', 'end_time', 'real_start_time', 'real_end_time', 'shop_id'],
                where: {
                    worker_id: workerData.id, shop_id: positionData.shop_id,
                    year: yearNow, month: monthNow, day: dateNow
                }
            });
            console.log("success to get today position schedule info");
        }
        catch (err) {
            console.log("no today position schedule ", err);
        }
        totalData.shopInfo = shopInfo;


        if (scheduledData) {

            totalData.shopInfo.status = 0;

            if(scheduledData.real_start_time)// || ((parseInt(hourNow) > parseInt(scheduledData.start_time.substring(0,2))) || (hourNow == scheduledData.start_time.substring(0,2) && parseInt(minNow) > parseInt(scheduledData.start_time.substring(2,4)))))
            {
                // 출근시간을 찍지 않았으면 근무전으로 표시
                totalData.shopInfo.status = 1;
            }

            if((parseInt(hourNow) > parseInt(scheduledData.end_time.substring(0,2)))
                || (hourNow == scheduledData.end_time.substring(0,2) && parseInt(minNow) > parseInt(scheduledData.end_time.substring(2,4)))) {
                // 출근시간을 찍지 않았거나 퇴근시간을 찍었으면 근무후로 표시
                if (!scheduledData.real_start_time || scheduledData.real_end_time) totalData.shopInfo.status = 2;
                else totalData.shopInfo.status = 1;
            }

            const scheduleInfo = {
                positionTitle: workerData.position_title.substring(0, 2) + " " + workerData.position_title.substring(2),
                startTime: scheduledData.start_time,
                endTime: scheduledData.end_time,
                realStartTime: scheduledData.real_start_time,
                realEndTime: scheduledData.real_end_time,
                remainTime: timeUtil.subtract(hourNow + minNow, scheduledData.end_time)
            };
            totalData.scheduleInfo = scheduleInfo;


            // 업무
            totalData.taskInfo = await taskUtil.getTodayTaskCount(scheduledData.shop_id, workerData.id);
        }

            // 소통창
            const boardData = await board.findAll({
                limit: 4,
                attributes: ['status', 'id', 'title'],
                where: {shop_id: positionData.shop_id, status: 0}, // 추후에 소통창까지
                order: [['register_date', 'DESC']]
            });

            // 공지사항의 경우, 확인유뮤
            let boardInfo = [];
            for (const bdata of boardData) {
                if (bdata.status == 0) {
                    let confirmCount = await comment.count({
                        where: {
                            board_id: bdata.id,
                            status: 0,
                            writer_job: req.job
                        }
                    });
                    if (confirmCount > 0)
                        bdata.dataValues.confirm = 1;
                    else bdata.dataValues.confirm = 0;
                }
                boardInfo.push(bdata);
            }
            totalData.boardInfo = boardInfo;


        console.log("success to get worker home page");
        res.json({
            code: "200",
            message: "근무자 홈화면 조회를 성공했습니다.",
            data: totalData
        });
        return;
    }
    catch(err) {
        console.log("get worker home page error", err);
        res.json({
            code: "400",
            message: "근무자 홈화면 조회에 오류가 발생했습니다."
        });
        return;
    }

});

// 관리자: 오늘의 근무자
router.get('/todayWorkers', userUtil.LoggedIn, async (req,res)=> {

    // 오늘의 날짜
    const now = new Date();
    const yearNow = now.getFullYear();
    const monthNow = now.getMonth()+1;
    const dateNow = now.getDate();

    const managerData = await manager.findOne({where: {id: req.job.substring(1)}});
    const shopData = await shop.findOne({where: {id: managerData.shop_id}});

    let workersInfo = [];
    try {
        // 근무자 정보
        const scheduledData = await schedule.findAll({
            attributes: ['worker_id'],
            where: {shop_id: shopData.id, year: yearNow, month: monthNow, day: dateNow},
            order: [['start_time', 'ASC']]
        });

        for(const sdata of scheduledData){
            let workerData = await worker.findOne({
                attributes: [['id', 'workerId'], ['position_title', 'workerTitle'], ['user_first_name', 'workerName'], ['image_path', 'workerImage']],
            where: {id: sdata.worker_id}});
            if(workerData)
                workersInfo.push(workerData);
        }

        console.log("success to get today workers list");
        res.json({
            code: "200",
            message: "오늘의 근무자 조회를 성공했습니다.",
            data: workersInfo
        })
        return;

    } catch (err) {
        console.log("get today workers list error", err);
        res.json({
            code: "400",
            message: "오늘의 근무자 조회에 오류가 발생했습니다."
        })
        return;
    }
});

// 근무자: 출근하기
router.put('/clock/:shopId', userUtil.LoggedIn, async (req,res)=>{

    const workerId = req.job.substring(1);

    try{
        if(!req.params.shopId){
            console.log("no shop id");
            res.json({
                code: "202",
                message: "큐알코드에 정보가 누락되었습니다."
            })
            return;
        }
        
        let positionId = await worker.findOne({attributes: ['id'], where: {id: workerId}});
        let positionIds = await position.findAll({attributes: ['id'], where: {shop_id: req.params.shopId}, raw: true});
        positionId = positionId['id'];
        positionIds = positionIds.map(e => e['id']);

        if(!(positionId in positionIds)){
            console.log("no worker match with shop position");
            res.json({
                code: "202",
                message: "큐알코드 정보가 올바르지 않습니다."
            })
            return;
        }

        const updateClockResult = await scheduleUtil.updateClock(workerId);
        return res.json(updateClockResult);
    }
    catch(err){
        console.log("clock update error", err);
        res.json({
            code: "400",
            message: "출근하기 및 퇴근하기에 오류가 발생했습니다."
        })
        return;
    }
});

// 관리자: QR코드
router.get('/qrcode', userUtil.LoggedIn, async (req,res)=>{

    try {
        const managerData = await manager.findOne({attributes: ['shop_id'], where: {id: req.job.substring(1)}});
        const data = managerData.shop_id.toString();
        const url = await qrcode.toDataURL(data, function (err, url) {
            //res.send(url);
            const qrdata = url.replace(/.*,/, '');
            const img = Buffer.from(qrdata, 'base64');

            console.log("success to make qrcode");
            res.writeHead(200, {'Content-Type': 'image/png'});
            res.end(img);
            return;
        });
    }
    catch(err){

        console.log("make qrcode error", err);
        res.json({
            code: "400",
            message: "매장 큐알코드 생성에 오류가 발생했습니다."
        });
    }

});

// 근무자: 홈 잔여시간
router.get('/worker/remainTime', userUtil.LoggedIn, async (req,res)=> {

    // 현재시간
    const now = new Date();
    const yearNow = now.getFullYear();
    const monthNow = now.getMonth()+1;
    const dateNow = now.getDate();
    const hourNow = String(now.getHours()).padStart(2, '0');
    const minNow = String(now.getMinutes()).padStart(2, '0');

    // 퇴근시간

    // 근무자 스케줄 정보
    let scheduledData;
    try {
        scheduledData = await schedule.findOne({
            attributes: ['start_time', 'end_time'],
            where: {
                worker_id: req.job.substring(1), year: yearNow, month: monthNow, day: dateNow
            }
        });
        console.log("success to get worker schedule time");
    }
    catch (err) {
        console.log("no today worker schedule", err);
        res.json({
            code: "400",
            message: "근무자 남은 시간 조회에 오류가 발생했습니다."
        });
        return;

    }

    console.log("success to get worker remain time");
    res.json({
        code: "200",
        message: "근무자 남은 시간 조회를 성공했습니다.",
        data: timeUtil.subtract(hourNow + minNow, scheduledData.end_time)
    });
    return;

})

module.exports = router;
