const publicHolidayApiKey = require('../config/publicHolidayApiKey');
const holidays = require('holidays-kr');

const { schedule, time, position, tasks, shop, worker } = require("../models");

const duration = 100;
const weekdays = [ '일', '월', '화', '수', '목', '금', '토'];

module.exports ={
    makeASchedule : async (positionId) => {

        // 현 시점부터 5개월간의 공휴일 정보
        let publicHolidays = [];
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth();

        holidays.serviceKey = publicHolidayApiKey.encoding;
        holidays.serviceKey = publicHolidayApiKey.encoding;
        holidays.getHolidays({
            year: yearNow,           // 수집 시작 연도
            month: monthNow,         // 수집 시작 월
            monthCount: 5            // 수집 월 갯수
        }).then(async (holidays) => {

            // 국가공휴일
            for(const holiday of holidays)
                publicHolidays.push(holiday.month + "/" +holiday.day)
            console.log("public holidays: ", publicHolidays);

            // 포지션 근무요일
            const timeData = await time.findAll({ attributes: ['day', 'start_time', 'end_time'], where: {status: 1, target_id: positionId} });
            let dayAndTime = {};
            for(const data of timeData)
                dayAndTime[data.day] = [data.start_time, data.end_time];
            console.log("position's schedule:", dayAndTime);

            const positionData = await position.findOne({ attributes: ['shop_id'], where: {id: positionId} });
            const shopData = await shop.findOne({ attributes: ['holiday'], where: {id: positionData.shop_id} });
            const offHoliday = shopData.holiday.includes("공휴일") ? 1: 0;

            try {
                // 100일치 스캐줄 생성
                for (var i = 0; i < duration; i++) {
                    let date = new Date(new Date().setDate(now.getDate() + i));

                    if (dayAndTime.hasOwnProperty(weekdays[date.getDay()])){

                        // 매장 휴무일 고려해서 100일 기간동안 스케줄 생성
                        if( offHoliday==0 || !publicHolidays.includes((date.getMonth() + 1) + "/" + date.getDate())) {
                            let scheduleData = {
                                position_id: positionId,
                                year: date.getFullYear(),
                                month: date.getMonth() + 1,
                                day: date.getDate(),
                                start_time: dayAndTime[weekdays[date.getDay()]][0],
                                end_time: dayAndTime[weekdays[date.getDay()]][1]
                            };
                            await schedule.create(scheduleData);
                            //console.log(date);
                        }
                    }
                }
            }
            catch(err) {
                console.log("make 100days schedule error with position id:", positionId, err);
                return;
            }
            console.log("make 100days schedule success with position id", positionId);
            return;
        });
    },

    makeAllSchedule : () => {

        // 현 시점부터 5개월간의 공휴일 정보
        let publicHolidays = [];
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth();

        holidays.serviceKey = publicHolidayApiKey.encoding;
        holidays.getHolidays({
            year: yearNow,           // 수집 시작 연도
            month: monthNow,         // 수집 시작 월
            monthCount: 5            // 수집 월 갯수
        }).then(async (holidays) => {

            // 국가공휴일
            for(const holiday of holidays)
                publicHolidays.push(holiday.month + "/" +holiday.day)
            console.log("public holidays: ", publicHolidays);

            const date = new Date(new Date().setDate(new Date().getDate() + (duration-1)));
            const day = weekdays[date.getDay()];

            try {
                await time.findAll({
                    attributes: ['target_id', 'day', 'start_time', 'end_time'],
                    where: {status: 1, day: day}
                })
                    .then(async (timeData) => {
                        for (const data of timeData) {

                            let positionData = await position.findOne({
                                attributes: ['shop_id'],
                                where: {id: data.target_id}
                            });
                            let shopData = await shop.findOne({
                                attributes: ['holiday'],
                                where: {id: positionData.shop_id}
                            });
                            let offHoliday = shopData.holiday.includes("공휴일") ? 1 : 0;

                            if (offHoliday == 0 || !publicHolidays.includes((date.getMonth() + 1) + "/" + date.getDate())) {

                                let scheduleData = {
                                    position_id: data.target_id,
                                    year: date.getFullYear(),
                                    month: date.getMonth() + 1,
                                    day: date.getDate(),
                                    start_time: data.start_time,
                                    end_time: data.end_time
                                };
                                await schedule.create(scheduleData);
                                //console.log(date);
                            }
                        }
                    })
                    .catch((err) => {
                        console.log("get time to make schedule error", err);
                        return;
                    })
            }
            catch(err){
                console.log("make schedule after 100days error", err);
                return;
            }
        });
    },

    // 근무자: 마이페이지 > 내정보 > 출퇴근기록
    // 관리자: 마이페이지 > 근무자 > 근무자 정보 > 출퇴근기록
    getCommuteRecord: async (positionId, year, month) => {
        console.log(positionId, year, month)

        let workerData;
        try {
            workerData = await worker.findOne({ where : {position_id: positionId} });
        } catch(err) {
            workerData = null;
        }

        const query = `select	*,
                                if(ifnull(real_start_time, start_time)+0 > start_time+0, 1, 0) as is_late
                       from(	select year, month, day, start_time, end_time, real_start_time, real_end_time
                                from schedule
                                where position_id = ${positionId}
                                and year = "${year}"
                                and month = "${month}"
                                and day <= day(now())
                                and date(register_date) between "${workerData.register_date}" and now()
                                order by day+0 desc
                            )	tmp`;

        try {
            const commuteData = await schedule.sequelize.query( query, { type: sequelize.QueryTypes.SELECT });

            console.log("success to get worker commute data");
            return {
                code: "200",
                message: `근무자의 ${year}년 ${month}월 춭퇴근기록 조회에 성공했습니다.`,
                data: {
                    year: year,
                    month: month,
                    commuteData
                }
            };
        }
        catch(err) {
            console.log("get worker commute data error", err);
            return {
                code: "400",
                message:  `근무자의 ${year}년 ${month}월 춭퇴근기록 조회에 오류가 발생했습니다.`
            };
        }

    }
};