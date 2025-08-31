const express = require('express');
const { getUser, updateUser } = require('../models/gameData');
const router = express.Router();

// 뽑기 확률 및 보상 설정
const gemRewards = {
    '일반': [1, 2, 3],
    '희귀': [4, 5, 6], 
    '에픽': [7, 8, 9],
    '전설': [10, 11, 12],
    '유니크': [13, 14, 15]
};

const gachaTypes = {
    'beginner': {
        costs: { 1: { points: 10 }, 10: { points: 100 } },
        probabilities: [
            { name: '일반', probability: 0.7 },
            { name: '희귀', probability: 0.2 },
            { name: '에픽', probability: 0.08 },
            { name: '전설', probability: 0.015 },
            { name: '유니크', probability: 0.005 }
        ]
    },
    'normal': {
        costs: { 1: { prisms: 5 }, 10: { prisms: 50 } },
        probabilities: [
            { name: '일반', probability: 0.5 },
            { name: '희귀', probability: 0.25 },
            { name: '에픽', probability: 0.15 },
            { name: '전설', probability: 0.07 },
            { name: '유니크', probability: 0.03 }
        ]
    },
    'premium': {
        costs: { 1: { prisms: 30 }, 10: { prisms: 300 } },
        probabilities: [
            { name: '일반', probability: 0.3 },
            { name: '희귀', probability: 0.3 },
            { name: '에픽', probability: 0.25 },
            { name: '전설', probability: 0.1 },
            { name: '유니크', probability: 0.05 }
        ]
    },
    'luxury': {
        costs: { 1: { prisms: 40 }, 10: { prisms: 400 } },
        probabilities: [
            { name: '일반', probability: 0.3 },
            { name: '희귀', probability: 0.3 },
            { name: '에픽', probability: 0.25 },
            { name: '전설', probability: 0.1 },
            { name: '유니크', probability: 0.05 }
        ]
    }
};

// 뽑기 실행
router.post('/draw', (req, res) => {
    const { userId, type, count = 1 } = req.body;
    const user = getUser(userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const gachaConfig = gachaTypes[type];
    if (!gachaConfig) {
        return res.status(400).json({ error: 'Invalid gacha type' });
    }
    
    const cost = gachaConfig.costs[count];
    if (!cost) {
        return res.status(400).json({ error: 'Invalid count' });
    }
    
    // 비용 확인
    if (cost.points && user.points < cost.points) {
        return res.status(400).json({ error: 'Insufficient points' });
    }
    if (cost.prisms && user.prisms < cost.prisms) {
        return res.status(400).json({ error: 'Insufficient prisms' });
    }
    
    // 비용 차감
    if (cost.points) user.points -= cost.points;
    if (cost.prisms) user.prisms -= cost.prisms;
    
    // 뽑기 실행
    const results = [];
    for (let i = 0; i < count; i++) {
        const result = performSingleGacha(gachaConfig.probabilities, type);
        results.push(result);
        
        // 인벤토리에 추가
        if (user.inventory[result.gemId]) {
            user.inventory[result.gemId]++;
        } else {
            user.inventory[result.gemId] = 1;
        }
    }
    
    updateUser(userId, user);
    
    res.json({
        success: true,
        results,
        newPoints: user.points,
        newPrisms: user.prisms,
        newInventory: user.inventory
    });
});

function performSingleGacha(probabilities, type) {
    const random = Math.random();
    let currentProbability = 0;
    let selectedGrade = probabilities[0];
    
    for (const grade of probabilities) {
        currentProbability += grade.probability;
        if (random <= currentProbability) {
            selectedGrade = grade;
            break;
        }
    }
    
    let possibleRewards = gemRewards[selectedGrade.name];
    let selectedReward;
    
    // 광안의 원석 특별 확률
    if (type === 'luxury') {
        if (selectedGrade.name === '전설' && Math.random() < 0.6) {
            selectedReward = 12; // 토파즈
        } else if (selectedGrade.name === '유니크' && Math.random() < 0.6) {
            selectedReward = 15; // 태양의 심장
        } else {
            selectedReward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
        }
    } else {
        selectedReward = possibleRewards[Math.floor(Math.random() * possibleRewards.length)];
    }
    
    return {
        grade: selectedGrade.name,
        gemId: selectedReward
    };
}

module.exports = router;
