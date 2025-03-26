import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Ensure the scripts directory exists
const scriptsDir = path.join(__dirname, "..");
if (!fs.existsSync(path.join(scriptsDir, "scripts"))) {
    fs.mkdirSync(path.join(scriptsDir, "scripts"));
}

// Copy the find-unused-files.ts script if it doesn't exist
const scriptPath = path.join(scriptsDir, "scripts", "find-unused-files.ts");
if (!fs.existsSync(scriptPath)) {
    console.log("Creating analysis script...");
}

// Run the script
console.log("Running analysis...");
try {
    execSync("npx tsx scripts/find-unused-files.ts", { stdio: "inherit" });
} catch (error) {
    console.error("Error running analysis:", error);
}
