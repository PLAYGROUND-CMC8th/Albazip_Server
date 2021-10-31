const randToken = require('rand-token');
const jwt = require('jsonwebtoken');
const {key} = require('../config/jwtSecretKey');

const options = {
    algorithm:"HS256",
    expiresIn:"30d",
    issuer:"AlbazipServer"
};

module.exports ={
    sign:(user) =>{
        const payload = {
            id:user.id
        };

        const newToken = {
            token:jwt.sign(payload, key, options)
            //,refreshToken:randToken.uid(256)
        };
        return newToken;
    },

    verify:(token) =>{
        let decoded;
        try{
            decoded = jwt.verify(token, key);
        } catch(err){
            if(err.message === 'jwt expired'){
                console.log('token expired already');
                return -1;
            }else if(err.message === 'invalid token') {
                console.log("token invalid");
                return -2;
            } else{
                console.log("invalid token with other reasons");
                return -3;
            }
        }
        return decoded;
    },

    /*refresh:(user) =>{
        const payload = {
            id:user.id
        };
        return jwt.sign(payload,key, options);
    }*/
};