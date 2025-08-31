const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정
app.use(cors({
    origin: [
        'https://yourusername.github.io',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://localhost:5500'
    ],
    credentials: true
}));

app.use(express.json());

// 라우트 설정
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/gacha', require('./routes/gacha'));

// 기본 라우트
app.get('/', (req, res) => {
    res.json({ 
        message: 'Gem Gacha API Server',
        status: 'running',
        endpoints: [
            'POST /api/auth/login',
            'GET /api/user/gamedata',
            'POST /api/user/earn-points',
            'POST /api/user/equip-gem',
            'POST /api/user/extract-gem',
            'POST /api/gacha/draw',
            'POST /api/user/buy-volume'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
