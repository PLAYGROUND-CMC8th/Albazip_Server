const { schedule, time, position, tasks, shop } = require("../models");


module.exports ={
    makeAllTask: async() => {
        const now = new Date();
        const yearNow = now.getFullYear();
        const monthNow = now.getMonth();
        const dateNow = now.getDate();

        await schedule.findAll({
            attributes: [postion_id],
            where: {
                year: yearNow,
                month: monthNow,
                day: dateNow
            }
        })
            .then((scheduleData) => {

                for(const sdata of scheduleData) {
                    let taskData = task.findAll({where: {status: 1, target_id: sdata.position_id}});

                    for (let tdata of taskData) {
                        tdata.status = 2;
                        task.create(tdata);
                        console.log(tdata);
                    }
                }
            })
            .catch((err) => {
                console.log("make todays task error", err);
                return;
            })
        console.log("make todays task success");
        return;
    }

};