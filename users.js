const users = [];

function userJoin(id, username, room) {
    // Check for empty or invalid parameters
    if (!username || !room) {
        return null;  // Return null if there's any issue
    }
    
    const user = { id, username, room };
    users.push(user);
    console.log('User joined:', user);  // Debug log to see the user object

    return user;
}

function getCurrentUser(id) {
    return users.find(user => user.id === id);
}

function userLeave(id) {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0]; // Return the removed user
    }
}

function getRoomUsers(room) {
    return users.filter(user => user.room === room);
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
};
