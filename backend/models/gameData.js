const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../database/users.json');

// 데이터베이스 초기화
function initDB() {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({}));
    }
}

// 사용자 데이터 로드
function loadUsers() {
    initDB();
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

// 사용자 데이터 저장
function saveUsers(users) {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

// 새 사용자 생성
function createUser() {
    const users = loadUsers();
    const userId = uuidv4();
    
    users[userId] = {
        points: 0,
        prisms: 0,
        inventory: {},
        volumes: { multi: false, chorus: false, lux: false },
        equippedGems: [],
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
    };
    
    saveUsers(users);
    return userId;
}

// 사용자 데이터 조회
function getUser(userId) {
    const users = loadUsers();
    return users[userId] || null;
}

// 사용자 데이터 업데이트
function updateUser(userId, userData) {
    const users = loadUsers();
    if (users[userId]) {
        users[userId] = { ...users[userId], ...userData, lastActive: new Date().toISOString() };
        saveUsers(users);
        return users[userId];
    }
    return null;
}

module.exports = {
    createUser,
    getUser,
    updateUser,
    loadUsers,
    saveUsers
};
