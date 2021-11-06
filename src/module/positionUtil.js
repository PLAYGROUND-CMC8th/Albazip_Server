const { position, task, user, manager, worker } = require('../models');

module.exports = {

    makeRandomCode: async ()=> {
        const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;

        let randomCode = '';
        while(1) {
            randomCode = '';
            for (let i = 0; i < 10; i++) {
                randomCode += characters.charAt(Math.floor(Math.random() * charactersLength));
            }

            let count = await position.count({where: {code: randomCode} });
            if(count == 0) break;
        }

        return randomCode;
    },
    getWorkerInfo: async(workerId) => {

    },
    getPositionInfo: async (positionId) => {

    },
    getPositionTaskList: async (positionId) => {
/*
        let taskData;
        try {
            tastData = await task.findAll({
                attributes: ['id', 'writer_job', 'title', 'content', 'register_date', 'update_date'],
                where: {
                    status: 0,
                    target_id: positionId
                }
            });

        }
        catch {
            console.log("get position task error", err);
            taskData = null;
        }

        let taskInfo = [];
        if(taskData) {
            for(const tdata of taskData){
                let status, date;
                if(tdata.register_date == tdata.update_date) {
                    status = "작성";
                    date = tdata.register_date;
                }
                else {
                    status = "수정";
                    date = tdata.update_date;
                }

                let writerTitle;
                if(tdata.job[1] == 'S')
                    title = "사장님";
                else {
                    let positionData;
                    try {
                        positionData = await position.findOne({ attributes: ['title'], where: {id: tdata.job.substring(1)}});
                    }
                    catch {
                        positionData = null;
                    }
                    writerTitle = positionData.title;
                }

                let writerName;
                if (tdata.job[1] == 'S'){
                   const mansgerData = await manager.findOne({ attributes: []})
                }else {

                }


                let data = {
                    title: tdata.title,
                    content: tdata.content,
                    writer_title: writerTitle,
                    writer_name: writerName,
                    date: date,
                    status: status
                }

                taskInfo.push(data);
            }
        }*/
    }


};