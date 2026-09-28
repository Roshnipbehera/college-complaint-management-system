const { execSync } = require("child_process");

console.log("================================================================================");
console.log("RUNNING COMPLETE TEST SUITE: WEEKS 6, 7 & 8 MILESTONES");
console.log("================================================================================");

const suites = [
    { name: "Week 6: CRUD APIs, Queries & Filtering", cmd: "node scripts/test-week6.js" },
    { name: "Week 7: Authentication, Bcrypt & Sessions/Cookies", cmd: "node scripts/test-week7.js" },
    { name: "Week 8: CORS, Security, Validation & Logging", cmd: "node scripts/test-week8.js" }
];

let allPassed = true;

for (const suite of suites) {
    console.log(`\n>>> STARTING: ${suite.name} >>>\n`);
    try {
        execSync(suite.cmd, { stdio: "inherit" });
        console.log(`\n>>> PASSED: ${suite.name} <<<\n`);
    } catch (err) {
        console.error(`\n>>> FAILED: ${suite.name} <<<\n`);
        allPassed = false;
        break;
    }
}

console.log("================================================================================");
if (allPassed) {
    console.log("ALL TEST SUITES (WEEKS 6, 7 & 8) PASSED SUCCESSFULLY! (100% PASS RATE)");
} else {
    console.error("SOME TEST SUITES FAILED.");
}
console.log("================================================================================");

process.exit(allPassed ? 0 : 1);
