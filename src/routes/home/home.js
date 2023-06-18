var express = require('express');
var router = express.Router();

const publicHolidayApiKey = require('../../config/publicHolidayApiKey');
const holidays = require('holidays-kr');
const sequelize = require('sequelize');
const qrcode = require('qrcode');
const Op = sequelize.Op;

var userUtil = require('../../module/userUtil');
var timeUtil = require('../../module/timeUtil');
var pushAlarm = require('../../module/pushAlarm');
var scheduleUtil = require('../../module/scheduleUtil');
var taskUtil = require('../../module/taskUtil');

const { manager, worker, shop, position, board, schedule, comment, time, Sequelize } = require('../../models');
const s = require('connect-redis');
const { parseHTML } = require('cheerio');

const weekdays = [ '일', '월', '화', '수', '목', '금', '토'];

// 관리자: 홈
router.get('/manager', userUtil.LoggedIn, async (req,res)=>{

    try {

        let totalData = {};

        // 오늘 날짜
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth()+1;
        const dateNow = now.getDate();
        const dayNow = now.getDay();

        // 전날 날짜
        const yesterday = new Date(now.getTime() - (24*60*60*1000));
        const yearYesterday = yesterday.getFullYear();
        const monthYesterday = yesterday.getMonth()+1;
        const dateYesterday = yesterday.getDate();
        const dayYesterday = yesterday.getDay();

        // 다음 날짜
        const tomorrow = new Date(now.getTime() + (24*60*60*1000));
        const yearTomorrow = tomorrow.getFullYear();
        const monthTomorrow = tomorrow.getMonth()+1;
        const dateTomorrow = tomorrow.getDate();
        const dayTomorrow = tomorrow.getDay();

        const todayInfo = {
            month: monthNow,
            date: dateNow,
            day: weekdays[dayNow]
        }
        totalData.todayInfo = todayInfo;

        // 매장 데이터
        const managerData = await manager.findOne({attributes: ['shop_id'], where: {id: req.job.substring(1)}});
        const shopData = await shop.findOne({where: {id: managerData.shop_id}});
        
        // 매장 영업데이터
        const timeDataToday = await time.findOne({attributes: ['start_time', 'end_time'], where: {status: 0, target_id: managerData.shop_id, day: weekdays[dayNow]}});
        const timeDataYesterday = await time.findOne({attributes: ['start_time', 'end_time'], 
                                                        where: {status: 0, target_id: managerData.shop_id, day: weekdays[(dayNow+6)%7],
                                                            end_time: { [Op.lte]: sequelize.col('start_time') }                                         
                                                    }});

        // 공휴일 유무 (전날부터 한달 카운트)
         holidays.serviceKey = publicHolidayApiKey.encoding;
         holidays.serviceKey = publicHolidayApiKey.encoding;
         const holidayResult = await holidays.getHolidays({
             year: yearYesterday,   // 수집 시작 연도
             month: monthYesterday, // 수집 시작 월
             monthCount: 1            // 수집 월 갯수
         });
        //let holidayResult = [];

        let publicHolidays = [];
         for(const holiday of holidayResult)
             publicHolidays.push(holiday.month + "/" +holiday.day)
        
        let shopHolidays = shopData.holiday.split(',');

        let openingDays = [0,0]; 
        let todayStart, todayEnd, yesterdayEnd;

        // 영업 데이터 존재하는지, 공휴일인지, 휴무일인지
        if (timeDataYesterday && !shopHolidays.includes(weekdays[dayYesterday])){
            if(!shopHolidays.includes('공휴일') || !publicHolidays.includes(monthYesterday+"/"+dateYesterday)){
                openingDays[0] = 1;  

                yesterdayEnd = new Date(yearNow,monthNow-1,dateNow,timeDataYesterday.end_time.substring(0,2),timeDataYesterday.end_time.substring(2,4));
            }
        } 
        if(timeDataToday && !shopHolidays.includes(weekdays[dayNow])){
            if(!shopHolidays.includes('공휴일') || !publicHolidays.includes(monthYesterday+"/"+dateYesterday)){
                openingDays[1] = 1;
                
                todayStart = new Date(yearNow,monthNow-1,dateNow,timeDataToday.start_time.substring(0,2),timeDataToday.start_time.substring(2,4));
                
                if(parseInt(timeDataToday.start_time) < parseInt(timeDataToday.end_time))
                    todayEnd = new Date(yearNow,monthNow-1,dateNow,timeDataToday.end_time.substring(0,2),timeDataToday.end_time.substring(2,4));
                else
                    todayEnd = new Date(yearTomorrow,monthTomorrow-1,dateTomorrow,timeDataToday.end_time.substring(0,2),timeDataToday.end_time.substring(2,4));
            }
        } 

        // shopStatus 0 : 영업 전, 1: 영업 중, 2: 영업 후, 3: 휴무
        let shopStatus, shopStartTime, shopEndTime;

        if(openingDays[0] == 0 && openingDays[1] == 0){
            shopStatus = 3;
            shopStartTime = null;
            shopEndTime = null;
        }
        else if(openingDays[0] == 1 && openingDays[1] == 0){
            if(now < yesterdayEnd)
                shopStatus = 1;
            else shopStatus = 3;

            shopStartTime = timeDataYesterday.start_time;
            shopEndTime = timeDataYesterday.end_time;
        }
        else if(openingDays[0] == 0 && openingDays[1] == 1){
            if(now < todayStart)
                shopStatus = 0;
            else if (todayStart <= now && now <= todayEnd)
                shopStatus = 1;
            else shopStatus = 2;

            shopStartTime = timeDataToday.start_time;
            shopEndTime = timeDataToday.end_time;
        }
        else if(openingDays[0] = 1 && openingDays[1] == 1){
            if(now < yesterdayEnd){
                shopStatus = 1;
                shopStartTime = timeDataYesterday.start_time;
                shopEndTime = timeDataYesterday.end_time;
            }
            else {
                if (yesterdayEnd <= now && now < todayStart)
                    shopStatus = 0;
                else if (todayStart <= now && now < todayEnd)
                    shopStatus = 1;
                else if (todayEnd < now) 
                    shopStatus = 2;
                else if (yesterdayEnd == todayStart)
                    shopStatus = 1;
                
                shopStartTime = timeDataToday.start_time;
                shopEndTime = timeDataToday.end_time;
            }
        }

        const shopInfo = {
            status: shopStatus, 
            name: shopData.name,
            startTime: shopStartTime,
            endTime: shopEndTime
        };
        totalData.shopInfo = shopInfo;

        if(shopInfo.status != 3) {

            // 오늘 근무자
            let workers = [];

            let scheduleDataYesterday = [], scheduleDataToday = [];
            if(openingDays[0] == 1){
                scheduleDataYesterday = await schedule.findAll({
                    attributes: ['worker_id'],
                    where: {shop_id: shopData.id, year: yearYesterday, month: monthYesterday, day: dateYesterday,
                        end_time: { [Op.lte]: sequelize.col('start_time') } 
                    }
                });
            }
            if(openingDays[1] == 1){
                scheduleDataToday = await schedule.findAll({
                    attributes: ['worker_id'],
                    where: {shop_id: shopData.id, year: yearNow, month: monthNow, day: dateNow}   
                });
            }
            const scheduleData = scheduleDataYesterday.concat(scheduleDataToday);
            
            let checkWorkerId = new Set(); // 전날 00시 이후 근무자와 오늘 근무자 중복 검사
            for (const sdata of scheduleData) {
                if(checkWorkerId.has(sdata.worker_id)) continue;

                let workerData = await worker.findOne({
                    attributes: [['position_title', 'title'], ['user_first_name', 'firstName']],
                    where: {id: sdata.worker_id}
                });
                if(workerData) {
                    workerData.dataValues.title = workerData.dataValues.title.substring(2);
                    workers.push(workerData);

                    checkWorkerId.add(sdata.worker_id);
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

        // 전날 날짜
        const yesterday = new Date(now.getTime() - (24*60*60*1000));
        const yearYesterday = yesterday.getFullYear();
        const monthYesterday = yesterday.getMonth()+1;
        const dateYesterday = yesterday.getDate();

         // 다음 날짜
         const tomorrow = new Date(now.getTime() + (24*60*60*1000));
         const yearTomorrow = tomorrow.getFullYear();
         const monthTomorrow = tomorrow.getMonth()+1;
         const dateTomorrow = tomorrow.getDate();
         const dayTomorrow = tomorrow.getDay();

        const todayInfo = {
            month: monthNow,
            date: dateNow,
            day: weekdays[dayNow]
        }
        totalData.todayInfo = todayInfo;

        //매장 정보
        const workerData = await worker.findOne({
            attributes: ['id', 'position_id', 'shop_name', 'position_title'],
            where: {id: req.job.substring(1)}
        });
        const positionData = await position.findOne({attributes: ['shop_id'], where:{id: workerData.position_id }});

         // 근무자 스케줄 정보
        const scheduleDataYesterday = await schedule.findOne({
            attributes: ['year','month', 'day','start_time', 'end_time', 'real_start_time', 'real_end_time', 'shop_id'],
            where: {
                worker_id: workerData.id, shop_id: positionData.shop_id,
                year: yearYesterday, month: monthYesterday, day: dateYesterday
            }
        });

        const scheduleDataToday = await schedule.findOne({
                attributes: ['year','month', 'day','start_time', 'end_time', 'real_start_time', 'real_end_time', 'shop_id'],
                where: {
                    worker_id: workerData.id, shop_id: positionData.shop_id,
                    year: yearNow, month: monthNow, day: dateNow
                }
        });

        let workingDays = [0,0]; 
        if(scheduleDataYesterday) workingDays[0] = 1;
        if(scheduleDataToday) workingDays[1] = 1;

        // 전날 스케줄이 존재한다면 마감 30분 후 시간데이터 생성필요
        let thirtyMinLaterYesterdaySchedule;
        if(scheduleDataYesterday) {
            thirtyMinLaterYesterdaySchedule = new Date(yearYesterday, monthYesterday-1, dateYesterday, scheduleDataYesterday.end_time.substring(0,2), scheduleDataYesterday.end_time.substring(2,4));  
            // 00시 이후 근무의 경우
            if(parseInt(scheduleDataYesterday.start_time) > parseInt(scheduleDataYesterday.end_time))
                thirtyMinLaterYesterdaySchedule.setTime(thirtyMinLaterYesterdaySchedule.getTime() + (24*60*60*1000))
            // 30분 이후 적용
            thirtyMinLaterYesterdaySchedule.setTime(thirtyMinLaterYesterdaySchedule.getTime() + (30*60*1000))
        }

        let shopStatus; // 0 : 영업 전, 1: 영업 중, 2: 영업 후, 3: 휴무
        if(workingDays[0] == 0 && workingDays[1] == 0){
            shopStatus = 3;
        }
        else if(workingDays[0] == 1 && workingDays[1] == 0){
            if(scheduleDataYesterday.real_end_time)
                shopStatus = 3;
            else {
                if (now < thirtyMinLaterYesterdaySchedule) 
                    shopStatus = 1;
                else shopStatus = 3;
            }
        }
        else if(workingDays[0] == 0 && workingDays[1] == 1){
            if(!scheduleDataToday.real_start_time && !scheduleDataToday.real_end_time)
                shopStatus = 0;
            else if(scheduleDataToday.real_start_time && !scheduleDataToday.real_end_time)
                    shopStatus = 1;
            else shopStatus = 2;
        }
        else if(workingDays[0] = 1 && workingDays[1] == 1){
            if(!scheduleDataYesterday.real_start_time){
                if(!scheduleDataToday.real_start_time)
                    shopStatus = 0;
                else shopStatus = 1;
            }
            else if(!scheduleDataYesterday.real_end_time){
                if (now < thirtyMinLaterYesterdaySchedule) 
                    shopStatus = 1;
                else {
                    if(!scheduleDataToday.real_start_time)
                        shopStatus = 0;
                    else if(!scheduleDataToday.real_end_time)
                        shopStatus = 1;
                    else 
                        shopStatus = 2;
                }
            }
            else {
                if(!scheduleDataToday.real_start_time)
                    shopStatus = 0;
                else if (!scheduleDataToday.real_end_time)
                    shopStatus = 1;
                else
                    shopStatus = 2;
            } 
        }
        let shopInfo = {
            status: shopStatus, // 0 : 근무 전, 1: 근무 중, 2: 근무 후, 3: 휴무
            shopName: workerData.shop_name
        };
        totalData.shopInfo = shopInfo;

        if (shopStatus != 3) {

            let whichSchedule; // 0 : 전날 스케줄, 1: 오늘 스케줄 
            if(workingDays[0] == 1 && workingDays[1] == 0){
                whichSchedule = 0;
            }
            else if(workingDays[0] == 0 && workingDays[1] == 1){
                whichSchedule = 1;
            }
            else if(workingDays[0] == 1 && workingDays[1] == 1){
                if(!scheduleDataYesterday.real_end_time){
                    
                    if (now < thirtyMinLaterYesterdaySchedule)
                        whichSchedule = 0;
                    else whichSchedule = 1;
                }
                else whichSchedule = 1;   
            }

            let scheduleInfo;
            if(whichSchedule == 0){
                scheduleInfo = {
                    positionTitle: workerData.position_title.substring(0, 2) + " " + workerData.position_title.substring(2),
                    startTime: scheduleDataYesterday.start_time,
                    endTime: scheduleDataYesterday.end_time,
                    realStartTime: scheduleDataYesterday.real_start_time,
                    realEndTime: scheduleDataYesterday.real_end_time,
                    remainTime: timeUtil.left(scheduleDataYesterday.dataValues)
                };
            }
            else {
                scheduleInfo = {
                    positionTitle: workerData.position_title.substring(0, 2) + " " + workerData.position_title.substring(2),
                    startTime: scheduleDataToday.start_time,
                    endTime: scheduleDataToday.end_time,
                    realStartTime: scheduleDataToday.real_start_time,
                    realEndTime: scheduleDataToday.real_end_time,
                    remainTime: timeUtil.left(scheduleDataToday.dataValues)
                };
            }
            totalData.scheduleInfo = scheduleInfo;

            // 업무
            totalData.taskInfo = await taskUtil.getTodayTaskCount(positionData.shop_id, workerData.id);
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

    // 전날 날짜
    const yesterday = new Date(now.getTime() - (24*60*60*1000));
    const yearYesterday = yesterday.getFullYear();
    const monthYesterday = yesterday.getMonth()+1;
    const dateYesterday = yesterday.getDate();
    
    // 매장 정보
    const managerData = await manager.findOne({where: {id: req.job.substring(1)}});
    const shopData = await shop.findOne({where: {id: managerData.shop_id}});

    let workersInfo = [];

    try {
    const scheduleDataYesterday = await schedule.findAll({
        attributes: ['worker_id'],
        where: {shop_id: shopData.id, year: yearYesterday, month: monthYesterday, day: dateYesterday,
                end_time: { [Op.lte] : sequelize.col('start_time') } 
            }
        });

    const scheduleDataToday = await schedule.findAll({
        attributes: ['worker_id'],
        where: {shop_id: shopData.id, year: yearNow, month: monthNow, day: dateNow}   
        });

    const scheduleData = scheduleDataYesterday.concat(scheduleDataToday);

    let checkWorkerId = new Set(); // 전날 00시 이후 근무자와 오늘 근무자 중복 검사
    for (const sdata of scheduleData) {
        if(checkWorkerId.has(sdata.worker_id)) continue;

        let workerData = await worker.findOne({
            attributes: [['position_title', 'title'], ['user_first_name', 'firstName']],
            where: {id: sdata.worker_id}
        });
        if(workerData) {
            workerData.dataValues.title = workerData.dataValues.title.substring(2);
            workersInfo.push(workerData);

            checkWorkerId.add(sdata.worker_id);
        }
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

// 관리자: 포지션 수 카운트 하기 
router.get('/positionCount', userUtil.LoggedIn, async (req,res)=>{

    try{
        const managerData = await manager.findOne({attributes: ['shop_id'], where: {id: req.job.substring(1)}});
        const positionData = await position.count({where: {shop_id :managerData.shop_id}});
        
        res.json({
            code: "200",
            message: "매장 포지션 수 조회를 성공했습니다.",
            data: positionData
        })
        return;
    }
    catch (err){
        console.log("get position count error", err);
        res.json({
            code: "400",
            message: "매장 포지션 수 조회에 오류가 발생했습니다."
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
        
        // 큐알코드 유효성 확인
        let positionId = await worker.findOne({attributes: ['position_id'], where: {id: workerId}});
        let positionIds = await position.findAll({attributes: ['id'], where: {shop_id: req.params.shopId}, raw: true});
        positionId = positionId['position_id'];
        positionIds = positionIds.map(e => e['id']);

        if(!(positionIds.includes(positionId))){
            console.log("no worker match with shop position");
            res.json({
                code: "202",
                message: "큐알코드 정보가 올바르지 않습니다."
            })
            return;
        }

        const updateClockResult = await scheduleUtil.updateClock(workerId, req.params.shopId);
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

    // 전날 날짜
    const yesterday = new Date(now.getTime() - (24*60*60*1000));
    const yearYesterday = yesterday.getFullYear();
    const monthYesterday = yesterday.getMonth()+1;
    const dateYesterday = yesterday.getDate();

    // 근무자 스케줄 정보
    let scheduleData;
    try {
        const scheduleDataYesterday = await schedule.findOne({
            attributes: ['year', 'month', 'day', 'start_time', 'end_time'],
            where: {
                worker_id: req.job.substring(1), year: yearYesterday, month: monthYesterday, day: dateYesterday
            }
        }); 
        const scheduleDataToday = await schedule.findOne({
            attributes: ['year', 'month', 'day', 'start_time', 'end_time'],
            where: {
                worker_id: req.job.substring(1), year: yearNow, month: monthNow, day: dateNow
            }
        });
        console.log("success to get worker schedule time");

        let thirtyMinLaterYesterdaySchedule;
        if(scheduleDataYesterday){
            thirtyMinLaterYesterdaySchedule = new Date(yearYesterday, monthYesterday-1, dateYesterday, scheduleDataYesterday.end_time.substring(0,2), scheduleDataYesterday.end_time.substring(2,4));  
            // 00시 이후 근무의 경우
            if(parseInt(scheduleDataYesterday.start_time) > parseInt(scheduleDataYesterday.end_time))
                thirtyMinLaterYesterdaySchedule.setTime(thirtyMinLaterYesterdaySchedule.getTime() + (24*60*60*1000))
            // 30분 이후 적용
            thirtyMinLaterYesterdaySchedule.setTime(thirtyMinLaterYesterdaySchedule.getTime() + (30*60*1000))
           
            if(now < thirtyMinLaterYesterdaySchedule)
                scheduleData = scheduleDataYesterday;
            else scheduleData = scheduleDataToday;
        }
        else if(scheduleDataToday){
            scheduleData = scheduleDataToday;
        }
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
        data: timeUtil.left(scheduleData.dataValues)
    });
    return;

})

module.exports = router;
