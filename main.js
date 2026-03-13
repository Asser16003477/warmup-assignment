const fs = require("fs");
function timeToSeconds(time) {
    if (!time) return 0;
    const isAmPm = time.toLowerCase().includes("am") || time.toLowerCase().includes("pm");
    
    if (isAmPm) {
        let [currentTime, period] = time.split(" ");
        let [h, m, s] = currentTime.split(":").map(Number);
        if (period.toLowerCase() === "pm" && h !== 12) h += 12;
        if (period.toLowerCase() === "am" && h === 12) h = 0;
        return h * 3600 + m * 60 + (s || 0);
    } else {
        let [h, m, s] = time.split(":").map(Number);
        return h * 3600 + m * 60 + s;
    }
}
function secondsToTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function
    let diff = timeToSeconds(endTime) - timeToSeconds(startTime);
    return secondsToTime(diff);
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function
    const start = timeToSeconds(startTime);
    const end = timeToSeconds(endTime);
    const workStart = timeToSeconds("8:00:00 am");
    const workEnd = timeToSeconds("10:00:00 pm");
    
    let idle = 0;
    if (start < workStart) idle += (workStart - start);
    if (end > workEnd) idle += (end - workEnd);
    return secondsToTime(idle);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    // TODO: Implement this function
    let active = timeToSeconds(shiftDuration) - timeToSeconds(idleTime);
    return secondsToTime(active);

}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function
    const activeSec = timeToSeconds(activeTime);
     const isEid = date >= "2025-04-10" && date <= "2025-04-30";
    const quota = isEid ? (6 * 3600) : (8 * 3600 + 24 * 60);
    return activeSec >= quota;
}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    const data = fs.readFileSync(textFile, "utf8").trim();
    const lines = data ? data.split("\n") : [];
    
    const exists = lines.some(line => {
        const p = line.split(",");
        return p[0] === shiftObj.driverID && p[2] === shiftObj.date;
    });

    if (exists) return {};

    const duration = getShiftDuration(shiftObj.startTime, shiftObj.endTime);
    const idle = getIdleTime(shiftObj.startTime, shiftObj.endTime);
    const active = getActiveTime(duration, idle);
    const quota = metQuota(shiftObj.date, active);

    const newRecord = {
        driverID: shiftObj.driverID,
        driverName: shiftObj.driverName,
        date: shiftObj.date,
        startTime: shiftObj.startTime,
        endTime: shiftObj.endTime,
        shiftDuration: duration,
        idleTime: idle,
        activeTime: active,
        metQuota: quota,
        hasBonus: false
    };

    const csvLine = `${newRecord.driverID},${newRecord.driverName},${newRecord.date},${newRecord.startTime},${newRecord.endTime},${newRecord.shiftDuration},${newRecord.idleTime},${newRecord.activeTime},${newRecord.metQuota},${newRecord.hasBonus}`;
    
    fs.appendFileSync(textFile, `\n${csvLine}`);
    return newRecord;
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function
    const data = fs.readFileSync(textFile, "utf8").trim();
    if (!data) return;
    const lines = data.split("\n");
    let updated = false;

    const newLines = lines.map(line => {
        let parts = line.split(",");
        if (parts[0] === driverID && parts[2] === date) {
            parts[9] = newValue.toString();
            updated = true;
        }
        return parts.join(",");
    });

    if (updated) {
        fs.writeFileSync(textFile, newLines.join("\n"));
    }
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    const data = fs.readFileSync(textFile, "utf8").trim();
    if (!data) return -1;
    const lines = data.split("\n");
    let count = 0;
    let driverExists = false;
    const targetMonth = parseInt(month);

    for (let line of lines) {
        let parts = line.split(",");
        if (parts[0] === driverID) {
            driverExists = true;
            let recordMonth = parseInt(parts[2].split("-")[1]);
            if (recordMonth === targetMonth && parts[9].trim() === "true") {
                count++;
            }
        }
    }
    return driverExists ? count : -1;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
    const data = fs.readFileSync(textFile, "utf8").trim();
    const lines = data.split("\n");
    let totalSeconds = 0;
    const targetMonth = parseInt(month);

    for (let line of lines) {
        let parts = line.split(",");
        let recordMonth = parseInt(parts[2].split("-")[1]);
        if (parts[0] === driverID && recordMonth === targetMonth) {
            totalSeconds += timeToSeconds(parts[7]);
        }
    }
    return secondsToTime(totalSeconds);
}

// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
    const rateData = fs.readFileSync(rateFile, "utf8").trim().split("\n");
    let dayOff = "";
    for (let row of rateData) {
        let p = row.split(",");
        if (p[0] === driverID) {
            dayOff = p[1].trim();
            break;
        }
    }

    const shiftData = fs.readFileSync(textFile, "utf8").trim().split("\n");
    let totalReqSeconds = 0;
    const targetMonth = parseInt(month);

    for (let line of shiftData) {
        let parts = line.split(",");
        let dateStr = parts[2];
        let recordMonth = parseInt(dateStr.split("-")[1]);

        if (parts[0] === driverID && recordMonth === targetMonth) {
            let dateObj = new Date(dateStr);
            let dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            if (dayName !== dayOff) {
                let isEid = dateStr >= "2025-04-10" && dateStr <= "2025-04-30";
                totalReqSeconds += isEid ? (6 * 3600) : (8 * 3600 + 24 * 60);
            }
        }
    }
    totalReqSeconds -= (bonusCount * 2 * 3600);
    return secondsToTime(totalReqSeconds < 0 ? 0 : totalReqSeconds);
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function
    const rateData = fs.readFileSync(rateFile, "utf8").trim().split("\n");
    let basePay, tier;
    for (let row of rateData) {
        let p = row.split(",");
        if (p[0] === driverID) {
            basePay = parseInt(p[2]);
            tier = parseInt(p[3]);
            break;
        }
    }
    const actualSec = timeToSeconds(actualHours);
    const requiredSec = timeToSeconds(requiredHours);
    let missingSec = requiredSec - actualSec;
    if (missingSec <= 0) return basePay;

    const allowances = { 1: 50, 2: 20, 3: 10, 4: 3 };
    let allowedSec = (allowances[tier] || 0) * 3600;
    let billableMissingSec = missingSec - allowedSec;
    if (billableMissingSec <= 0) return basePay;

    let fullMissingHours = Math.floor(billableMissingSec / 3600);
    let deductionRate = Math.floor(basePay / 185);
    return Math.floor(basePay - (fullMissingHours * deductionRate));
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
