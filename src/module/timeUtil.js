
module.exports = {
    left:  (scheduleData) => {

        const nowTime = new Date();
        
        let endTime = new Date(scheduleData.year, parseInt(scheduleData.month)-1, scheduleData.day, scheduleData.end_time.substring(0,2), scheduleData.end_time.substring(2,4), 00);
        // 마감시간이 00시를 넘어간 경우
        if(parseInt(scheduleData.start_time) > parseInt(scheduleData.end_time))
            endTime = endTime.setTime(endTime.getTime() + (24*60*60*1000));

        let leftTime, leftHour, leftMin;
        let minus = false;

        if(endTime > nowTime) {
            leftTime = endTime - nowTime;
            leftHour = Math.floor(leftTime/(60*60*1000));
            leftMin = Math.ceil(leftTime/(60*1000) - (60*leftHour)); // 초를 고려하여 반올림

        } else {
            leftTime = nowTime - endTime;
            minus = true;
            leftHour = Math.floor(leftTime/(60*60*1000));
            leftMin = Math.floor(leftTime/(60*1000) - (60*leftHour)); // 초를 고려하여 내림 (?)
        }
        return (minus ? "-": "") + String(leftHour).padStart(2,"0") + String(leftMin).padStart(2, "0");
    }
};