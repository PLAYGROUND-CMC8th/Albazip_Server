const { user } = require('../models');

module.exports = {
    checkPhoneExistance: async (phone) => {
        return await user.count({
            where: {
                phone: phone
            }
        })
            .then(count => {
                console.log("existed phone count:" + count);
                return count !== 0;

            });

    }
};