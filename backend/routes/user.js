const express = require('express');
const { getUser, updateUser } = require('../models/gameData');
const router = express.Router();

// 보석 데이터 (프론트엔드와 동일)
const gemData = {
    1: { name: '작은 수정', emoji: '💎', chorus: 1, multiple: 1, lux: 0 },
    2: { name: '푸른 수정', emoji: '🔷', chorus: 2, multiple: 1, lux: 0 },
    3: { name: '붉은 수정', emoji: '🔶', chorus: 3, multiple: 1, lux: 0 },
    4: { name: '에메랄드', emoji: '💚', chorus: 4, multiple: 1, lux: 0 },
    5: { name: '사파이어', emoji: '💙', chorus: 5, multiple: 1, lux: 0 },
    6: { name: '루비', emoji: '❤️', chorus: 6, multiple: 1, lux: 0 },
    7: { name: '자수정', emoji: '💜', chorus: 7, multiple: 1.1, lux: 0 },
    8: { name: '황금석', emoji: '💛', chorus: 8, multiple: 1.2, lux: 0 },
    9: { name: '다이아몬드', emoji: '💍', chorus: 9, multiple: 1.3, lux: 0 },
    10: { name: '오팔', emoji: '🌈', chorus: 10, multiple: 1.4, lux: 0.5 },
    11: { name: '진주', emoji: '🤍', chorus: 11, multiple: 1.5, lux: 0.8 },
    12: { name: '토파즈', emoji: '🧡', chorus: 12, multiple: 1.6, lux: 1.0 },
    13: { name: '별의 조각', emoji: '⭐', chorus: 15, multiple: 2.0, lux: 2.5 },
    14: { name: '달의 눈물', emoji: '🌙', chorus: 20, multiple: 2.5, lux: 4.0 },
    15: { name: '태양의 심장', emoji: '☀️', chorus: 25, multiple: 3.0, lux: 5.0 }
};

// 스탯 계산 함수
function calculateStats(equippedGems, volumes) {
    let totalChorus = 0;
    let totalMultiple = 0;
    let totalLux = 0;
    
    equippedGems.forEach(gemId => {
        const gem = gemData[gemId];
        if (gem) {
            if (volumes.chorus) {
                totalChorus += gem.chorus;
            } else {
                totalChorus = Math.max(totalChorus, gem.chorus);
            }
            
            if (volumes.multi) {
                totalMultiple += (gem.multiple - 1);
            } else {
                totalMultiple = Math.max(totalMultiple, gem.multiple - 1);
            }
            
            if (volumes.lux && gem.lux) {
                totalLux += gem.lux;
            } else if (gem.lux) {
                totalLux = Math.max(totalLux, gem.lux);
            }
        }
    });
    
    return {
        chorus: Math.max(1, totalChorus),
        multiple: 1 + totalMultiple,
        lux: totalLux
    };
}

// 게임 데이터 조회
router.get('/gamedata/:userId', (req, res) => {
    const user = getUser(req.params.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        points: user.points,
        prisms: user.prisms,
        inventory: user.inventory,
        volumes: user.volumes,
        equippedGems: user.equippedGems
    });
});

// 포인트 획득
router.post('/earn-points', (req, res) => {
    const { userId } = req.body;
    const user = getUser(userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const stats = calculateStats(user.equippedGems, user.volumes);
    const earnedPoints = Math.round((1 + stats.chorus) * stats.multiple);
    
    let prismsEarned = 0;
    if (stats.lux > 0 && Math.random() * 100 < stats.lux) {
        prismsEarned = 1;
        user.prisms += 1;
    }
    
    user.points += earnedPoints;
    updateUser(userId, user);
    
    res.json({
        earnedPoints,
        newPoints: user.points,
        prismsEarned,
        newPrisms: user.prisms
    });
});

// 보석 장착/해제
router.post('/equip-gem', (req, res) => {
    const { userId, gemId, action } = req.body;
    const user = getUser(userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const maxSlots = 1 + (user.volumes.multi ? 1 : 0) + (user.volumes.chorus ? 1 : 0) + (user.volumes.lux ? 1 : 0);
    
    if (action === 'equip') {
        if (user.equippedGems.length >= maxSlots) {
            return res.status(400).json({ error: 'No available slots' });
        }
        if (user.equippedGems.includes(parseInt(gemId))) {
            return res.status(400).json({ error: 'Gem already equipped' });
        }
        user.equippedGems.push(parseInt(gemId));
    } else if (action === 'unequip') {
        const index = user.equippedGems.indexOf(parseInt(gemId));
        if (index > -1) {
            user.equippedGems.splice(index, 1);
        }
    }
    
    updateUser(userId, user);
    res.json({ success: true, equippedGems: user.equippedGems });
});

// 보석 추출
router.post('/extract-gem', (req, res) => {
    const { userId, gemId } = req.body;
    const user = getUser(userId);
    
    if (!user || !user.inventory[gemId] || user.inventory[gemId] < 2) {
        return res.status(400).json({ error: 'Not enough gems to extract' });
    }
    
    user.inventory[gemId]--;
    
    // 등급별 프리즘 보상
    const gemRewards = {
        '일반': [1, 2, 3],
        '희귀': [4, 5, 6], 
        '에픽': [7, 8, 9],
        '전설': [10, 11, 12],
        '유니크': [13, 14, 15]
    };
    
    let grade = '일반';
    for (const [gradeName, gemIds] of Object.entries(gemRewards)) {
        if (gemIds.includes(parseInt(gemId))) {
            grade = gradeName;
            break;
        }
    }
    
    const prismRewards = { '일반': 1, '희귀': 3, '에픽': 8, '전설': 20, '유니크': 60 };
    const prismReward = prismRewards[grade];
    
    user.prisms += prismReward;
    updateUser(userId, user);
    
    res.json({
        success: true,
        prismReward,
        newPrisms: user.prisms,
        newInventory: user.inventory
    });
});

// 볼륨 구매
router.post('/buy-volume', (req, res) => {
    const { userId, type } = req.body;
    const user = getUser(userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.volumes[type]) {
        return res.status(400).json({ error: 'Volume already owned' });
    }
    
    let cost, currency, canBuy = false;
    
    switch(type) {
        case 'multi':
            if (user.points >= 100000) {
                user.points -= 100000;
                canBuy = true;
            }
            break;
        case 'chorus':
            if (user.points >= 55000) {
                user.points -= 55000;
                canBuy = true;
            }
            break;
        case 'lux':
            // 전설 이상 보석 확인 (간단화)
            if (user.prisms >= 100) {
                user.prisms -= 100;
                canBuy = true;
            }
            break;
    }
    
    if (canBuy) {
        user.volumes[type] = true;
        updateUser(userId, user);
        res.json({ success: true, volumes: user.volumes, points: user.points, prisms: user.prisms });
    } else {
        res.status(400).json({ error: 'Insufficient resources' });
    }
});

module.exports = router;
