
class rightCtrl {
    constructor(right) {
        this.right = right;
    }

    addRight() {
        for (let arg of arguments) this.right |= arg;
    }

    removeRight() {
        for (let arg of arguments) this.right ^= arg;
    }
    
    findRight(right) {
        return this.right & right ? true : false;
    }

    getRight() {
        return this.right;
    }
    
    isMessage() {
        return this.isAdmin() || this.right & 0x1 ? true : false; 
    }
    isScheduleAndNotice() {
        return this.isAdmin() || this.right & 0x2 ? true : false;
    }
    isAdmin() {
        return this.isSuperAdmin() || this.isClassAdmin() || this.isUsersAdmin() ? true : false;
    }
    isUsersAdmin() {
        return this.isSuperAdmin() || this.right & 0x4 ? true : false;
    }
    isClassAdmin() {
        return this.isSuperAdmin() || this.right & 0x8 ? true : false;
    }
    isSuperAdmin() {
        return this.right & 0x10 ? true : false;
    }
}

/*
0x01 : R message CUD personal message
0x02 : R schedule & notice CUD personal schedule & notice
0x04 : (admin) kick out member & give right(0x01 0x02)
0x08 : (admin) D all notice & schedule
0x10 : (super) delete class & give right(0x04 0x08)
*/

module.exports = rightCtrl;