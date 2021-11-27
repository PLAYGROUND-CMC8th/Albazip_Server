var express = require('express');
var router = express.Router();

var userUtil = require('../../module/userUtil');

const { time, shop, manager, worker } = require('../../models');

// 매장 변경 전 조회하기
router.get('/:managerId', userUtil.LoggedIn, async (req,res)=>{

    const managerId = req.params.managerId;
    const managerData = await manager.findOne({attributes: ['shop_id'], where: {id: managerId}});
    await shop.findOne({
        attributes: ['name', 'type', 'address', 'holiday', 'start_time', 'end_time','payday'],
        where: {id: managerData.shop_id}})
        .then( async(shopData) => {
            console.log("success to get shop data");
            let data = {
                name: shopData.name,
                type: shopData.type,
                address: shopData.address,
                holiday: shopData.dataValues.holiday.split(','),
                startTime: shopData.start_time,
                endTime: shopData.end_time,
                payday: shopData.payday
            }
            res.json({
                code: "200",
                message: "매장 편집 전 정보조회에 성공했습니다.",
                data: data
            })
            return;
        })
        .catch((err) => {
            console.log("get shop data error", err);
            res.json({
                code: "400",
                message: "매장 편집 전 정보조회에 오류가 발생했습니다."
            })
            return;
        });
});

// 매장 변경하기
router.post('/:managerId', userUtil.LoggedIn, async (req,res)=>{

    try {
        const managerId = req.params.managerId;
        const managerData = await manager.findOne({attributes: ['shop_id'], where: {id: managerId}});
        const {name, type, address, holiday, startTime, endTime, payday} = req.body;
        const weekday = ['월', '화', '수', '목', '금', '토', '일'];

        // 1. 파라미터 체크하기
        if (!name || !type || !address || !startTime || !endTime || !payday) {
            console.log("not enough parameter")
            res.json({
                code: "202",
                message: "필수정보를 입력해주세요."
            })
            return;
        }

        // 2. 매장 휴무날 변경여부 확인하기
        const before = await shop.findOne({where: {id: managerData.shop_id}});

        let timeChange = false;
        if (before.holiday.length != holiday.join(',').length || before.holiday.split(',').sort().toString() != [...holiday].sort().toString()
            || before.start_time != startTime || before.end_time != endTime)
            timeChange = true;

        // 3. 매장정보 업데이트
        let shopData = {
            name: name,
            type: type,
            address: address,
            holiday: holiday.join(","),
            start_time: startTime,
            end_time: endTime,
            payday: payday
        };

        try {
            await shop.update(shopData, {where: {id: managerData.shop_id}});
            console.log("success to update shop data");
        } catch (err) {
            console.log("update shop data error", err);
            res.json({
                code: "400",
                message: "매장정보 업데이트에 오류가 발생했습니다."
            })
            return;
        }

        // 4. 매장 영업시간 업데이트
        try {
            if (timeChange) {
                await time.destroy({where: {status: 0, target_id: managerData.shop_id}});
                console.log("success to delete times");

                let workday = weekday.filter((day) => !holiday.includes(day));
                for (const day of workday) {
                    let timeData = {
                        status: 0,
                        target_id: managerData.shop_id,
                        day: day,
                        start_time: startTime,
                        end_time: endTime
                    };
                    // 매장 엽업일 생성
                    await time.create(timeData);
                }
                console.log("success to create times");
            }
        } catch (err) {
            console.log("create times error", err);
            res.json({
                code: "400",
                message: "매장 요일별 영업시간 업데이트 오류가 발생했습니다."
            });
            return;
        }

        // 5. 매장명 변경여부 manager, worker에 적용하기
        console.log(before.name, name)
        try {
            if (before.name != name) {

                // manager shop_name
                await manager.update({shop_name: name}, {where: {id: managerData.shop_id}});
                console.log("success to update manager data");

                const query = `update worker
                               set shop_name = "${name}" 
                               where id in 
                               (select * from (select w.id 
			                                   from position p 
			                                   inner join worker w
			                                   on p.id = w.position_id
			                                   where p.shop_id = ${managerData.shop_id})tmp)`;

                // worker shop_name
                await worker.sequelize.query( query, { type: sequelize.QueryTypes.UPDATE });
                console.log("success to update worker data");
            }
        }
        catch(err) {
            console.log("update manager date error", err);
            res.json({
                code: "400",
                message: "매장 변경에 따른 관리자 및 근무자 정보 변경시 오류가 발생했습니다."
            });
            return;
        }

        console.log("success to change shop data");
        res.json({
            code: "200",
            message: "매장 편집을 성공했습니다."
        });
        return;
    }
    catch(err) {
        console.log("change shop data error", err);
        res.json({
            code: "400",
            message: "매장 편집에 오류가 발생했습니다."
        });
        return;
    }

});

// 매장 삭제하기
router.delete('/:managerId', userUtil.LoggedIn, async (req,res)=>{

    const managerId = req.params.managerId;
    const deleteManagerResult = await userUtil.deleteManager(managerId);
    return res.json(deleteManagerResult);

});


module.exports = router;