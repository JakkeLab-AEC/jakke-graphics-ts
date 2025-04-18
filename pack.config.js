const fs = require("fs");
const { execSync } = require("child_process");

const outputDir = "./packed";

if(!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

execSync("npx tsc");
execSync(`npm pack --pack-destination ${outputDir}`);