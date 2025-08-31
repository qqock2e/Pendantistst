const express = require('express');
const { createUser, getUser } = require('../models/gameData');
const router = express.Router();

// 간단한 로그인 (새 사용자 생성 또는 기존 사용자 확인)
router.post('/login', (req, res) => {
    const { userId } = req.body;
    
    let user;
    if (userId && getUser(userId)) {
        user = getUser(userId);
    } else {
        const newUserId = createUser();
        user = getUser(newUserId);
        user.userId = newUserId;
    }
    
    res.json({
        success: true,
        userId: user.userId || userId,
        message: 'Login successful'
    });
});

module.exports = router;

