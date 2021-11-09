const { schedule, time, position, task, shop, manager } = require("../models");


module.exports ={
    makeAllTask: async() => {
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth();
        const dateNow = now.getDate();

        await schedule.findAll({
            attributes: ['postion_id'],
            where: {
                year: yearNow,
                month: monthNow,
                day: dateNow
            }
        })
            .then((scheduleData) => {

                for(const sdata of scheduleData) {
                    let taskData = task.findAll({where: {status: 0, target_id: sdata.position_id}});

                    for (let tdata of taskData) {
                        tdata.status = 2;
                        tdata.target_date = new Date();
                        task.create(tdata);
                    }
                }
            })
            .catch((err) => {
                console.log("make todays task error", err);
                return;
            })
        console.log("make todays task success");
        return;
    },

    // 마이페이지 > 하단 > 근무자 > 하단 > 업무 리스트
    getPositionTaskList: async (positionId) => {
        try {

            let taskData;
            try {
                taskData = await task.findAll({
                    attributes: ['id', ['writer_job', 'writerTitle'], 'title', 'content', ['register_date', 'registerDate']],
                    where: {
                        status: 0,
                        target_id: positionId
                    }
                });
                console.log("success to get position task data");
            } catch {
                console.log("get position task data error", err);
                return {
                    code: "400",
                    message: "근무자의 업무 조회에 오류가 발생했습니다."
                };
            }

            if (taskData) {
                try {
                    for (let tdata of taskData) {

                        console.log(tdata)
                        if (tdata.dataValues.writerTitle[0] == 'S') {
                            let managerData = await manager.findOne({where: {shop_id: tdata.dataValues.writerTitle.substring(1)}});
                            tdata.dataValues.writerName = managerData.user_last_name + managerData.user_first_name;
                            tdata.dataValues.writerTitle = "사장님";
                        } else if (tdata['writerTitle'][0] == 'P') {
                            let workerData = await worker.findOne({where: {position_id: tdata.dataValues.writerTitle.substring(1)}});
                            tdata.dataValues.writerName = workerData.user_first_name;
                            tdata.dataValues.writerTitle = workerData.position_title;
                        }
                    }
                    console.log("success to get task writer");
                } catch (err) {
                    console.log("get task writer error", err);
                }
            }
            console.log("success to get position task list");
            return {
                code: "200",
                message: "근무자의 업무리스트 조회를 성공했습니다.",
                data: taskData
            };

        }
        catch(err) {
            console.log("get position task list error", err);
            return {
                code: "400",
                message: "근무자의 업무리스트 조회에 오류가 발생했습니다."
            };
        }
    }

};