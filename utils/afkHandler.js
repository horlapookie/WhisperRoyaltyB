
const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const dbDir = './database';
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const afkFilePath = path.join(dbDir, 'afk-user.json');

// Initialize AFK file if it doesn't exist
if (!fs.existsSync(afkFilePath)) {
    fs.writeFileSync(afkFilePath, JSON.stringify([], null, 2));
}

// Function to load AFK data
const loadAfkData = () => {
    try {
        return JSON.parse(fs.readFileSync(afkFilePath, 'utf8'));
    } catch (error) {
        return [];
    }
};

// Function to save AFK data
const saveAfkData = (data) => {
    fs.writeFileSync(afkFilePath, JSON.stringify(data, null, 2));
};

// Function to add a user to the AFK list
const addAfkUser = (userId, time, reason) => {
    const _dir = loadAfkData();
    const userExists = _dir.find(user => user.id === userId);
    if (!userExists) {
        const obj = { id: userId, time: time, reason: reason };
        _dir.push(obj);
        saveAfkData(_dir);
    }
};

// Function to check if a user is in the AFK list
const checkAfkUser = (userId) => {
    const _dir = loadAfkData();
    return _dir.some(user => user.id === userId);
};

// Function to get the AFK reason of a user
const getAfkReason = (userId) => {
    const _dir = loadAfkData();
    const user = _dir.find(user => user.id === userId);
    return user ? user.reason : null;
};

// Function to get the AFK time of a user
const getAfkTime = (userId) => {
    const _dir = loadAfkData();
    const user = _dir.find(user => user.id === userId);
    return user ? user.time : null;
};

// Function to get the AFK ID of a user
const getAfkId = (userId) => {
    const _dir = loadAfkData();
    const user = _dir.find(user => user.id === userId);
    return user ? user.id : null;
};

// Function to get the position of a user in the AFK list
const getAfkPosition = (userId) => {
    const _dir = loadAfkData();
    return _dir.findIndex(user => user.id === userId);
};

// Function to remove user from AFK list
const removeAfkUser = (userId) => {
    const _dir = loadAfkData();
    const filteredData = _dir.filter(user => user.id !== userId);
    saveAfkData(filteredData);
};

module.exports = {
    addAfkUser,
    checkAfkUser,
    getAfkReason,
    getAfkTime,
    getAfkId,
    getAfkPosition,
    removeAfkUser
};
