import axios from "axios";
import { promises as fs } from "fs";
import * as path from "path";

// Retrieve command line arguments
const args = process.argv.slice(2); // Skip the first two entries
const url = args[0]; // First argument: URL of the webpage
const fileName = args[1]; // Second argument: File to store the last fetched content

if (!url || !fileName) {
  console.error("Usage: npm run start <url> <fileName>");
  process.exit(1);
}

const filePath = path.join("snapshots", fileName);

async function fetchWebpageContent() {
  try {
    const response = await axios.get<string>(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching the webpage:", error);
    process.exit(1);
  }
}

async function readLastContent() {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch (error) {
    // Assuming error means file doesn't exist yet.
    return null;
  }
}

async function writeContent(content: string) {
  await fs.writeFile(filePath, content, "utf-8");
}

async function checkForChanges() {
  const currentContent = await fetchWebpageContent();
  const lastContent = await readLastContent();

  if (lastContent !== null && currentContent !== lastContent) {
    console.log("Content has changed!");
  } else {
    console.log("No changes detected.");
  }

  await writeContent(currentContent);
}

checkForChanges();
