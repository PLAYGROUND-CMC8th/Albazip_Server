var express = require('express');
//var router = express.Router();

var asyncify = require('express-asyncify');
var router = asyncify(express.Router());

var userUtil = require('../../module/userUtil');
var boardUtil = require('../../module/boardUtil');

// 소통창 검색
router.get('/search', userUtil.LoggedIn, async (req,res)=> {

    const searchWord = req.body.searchWord;
    const searchBoardResult = await boardUtil.searchBoard(req.job, 1, searchWord);
    return res.json(searchBoardResult);

});

// 소통창 검색 (페이지)
router.get('/search/:page', userUtil.LoggedIn, async (req,res)=> {

    const reqPage = req.params.page;
    const searchWord = req.body.searchWord;
    const searchBoardResult = await boardUtil.searchBoard(req.job, reqPage, searchWord);
    return res.json(searchBoardResult);

});

// 소통창 검색 (페이지)
router.post('/report/:boardId', userUtil.LoggedIn, async (req,res)=> {

});

module.exports = router;