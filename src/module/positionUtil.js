const { position } = require('../models');

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
    }
};