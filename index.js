var fs = require('fs');

const WorkSec = 8 * 60 * 60 + 40 * 60;
const RelaxSec = 17 * 60 * 60 + 30 * 60;


const filterConfig = {
    team: '前置',
    names: ['王齐源', '柳勇', '高阳']
}

function Reporter(report) {
    this.team = report[1].toString();
    this.workerName = report[2].toString();
    this.week = Number.parseInt(report[3]);
    this.date = report[6];
    this.time = report[7];
}

Reporter.prototype.getSeconds = function () {
    var hour = this.time.split(':')[0];
    var min = this.time.split(':')[1];
    return hour * 60 * 60 + min * 60;
}

Reporter.prototype.isDelay = function () {
    if (!this.isWeekend()) {
        var sec = this.getSeconds();
        if (sec > WorkSec && sec < RelaxSec) {
            return true;
        }
    }
    return false;
}

Reporter.prototype.isWeekend = function () {
    return this.week == 6 || this.week == 0;
}

Reporter.prototype.isExtendTime = function () {
    var sec = this.getSeconds();
    if (!this.isWeekend() && sec - RelaxSec > 20 * 60) {
        return true;
    }
}

var page = fs.readFileSync('./report.csv', "utf-8");
var sheet = page.split('\r\n');

filterConfig.names.forEach(name => {
    var reporters = [];
    sheet.forEach(cow => {
        var report = cow.split(',');
        if (report[1] && report[1] == filterConfig.team && name == report[2].toString().trim()) {
            var reporter = new Reporter(report);
            reporters.push(reporter);
        }
    });

    reporters.forEach(reporter => {
        var sameDayReporters = reporters.filter(rt => rt.date == reporter.date);
        isForgotSign(sameDayReporters);
        sameDayReporters.forEach(sameDayReporter => {
            var index = reporters.findIndex(x => sameDayReporter == x);
            reporters.splice(index, 1);
            if (sameDayReporter.isDelay()) {
                console.log(sameDayReporter.workerName + '在' + sameDayReporter.date + `当天迟到或早退，打卡时间为` + sameDayReporter.time);
            }
            if (sameDayReporter.isWeekend()) {
                console.log(sameDayReporter.workerName + '在' + sameDayReporter.date + `周末加班，加班时间为` + sameDayReporter.time);
            }
            if (sameDayReporter.isExtendTime()) {
                console.log(sameDayReporter.workerName + '在' + sameDayReporter.date + `工作日可能加班，加班时间为` + sameDayReporter.time);
            }
        })
    })
});

function isForgotSign(sameDayReporters) {
    if (!sameDayReporters[0].isWeekend()) {
        if (sameDayReporters.length == 1) {
            var sec = sameDayReporters[0].getSeconds();
            if (sec - WorkSec <= sec - RelaxSec) {
                console.log(sameDayReporters[0].workerName + '在' + sameDayReporters[0].date + `上午未打卡，打卡时间为` + sameDayReporters[0].time);
            } else {
                console.log(sameDayReporters[0].workerName + '在' + sameDayReporters[0].date + `下午未打卡,打卡时间为` + sameDayReporters[0].time);
            }
        }
        if (sameDayReporters.length > 1) {
            if (!sameDayReporters.find(sdr => !sdr.isDelay() && sdr.getSeconds() <= WorkSec)) {
                console.log(sameDayReporters[0].workerName + '在' + sameDayReporters[0].date + `当天上午未打指纹，指纹时间为` + sameDayReporters[0].time);
            }
            if (!sameDayReporters.find(sdr => !sdr.isDelay() && sdr.getSeconds() >= RelaxSec)) {
                console.log(sameDayReporters[0].workerName + '在' + sameDayReporters[0].date + `当天下午未打指纹，指纹时间为` + sameDayReporters[0].time);
            }
        }
    }
}
