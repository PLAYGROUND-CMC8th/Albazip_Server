const aws = require('aws-sdk');
aws.config.loadFromPath(__dirname + "/../config/s3.json");

const s3 = new aws.S3();
const multer = require('multer');
const multerS3 = require('multer-s3');

const path = require("path");

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'albazip-bucket',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read-write',
        key: function(req, file, cb) {
            let extension = path.extname(file.originalname)
            cb(null, Date.now().toString() + extension)
        }
    })/*,
    limits: { fileSize: 2 * 1024 * 1024 },*/
});


module.exports = upload;

