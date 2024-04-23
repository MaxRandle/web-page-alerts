import axios from "axios";
import { promises as fs } from "fs";
import * as path from "path";
import * as diff from "diff";
import * as cheerio from "cheerio";

// Retrieve command line arguments
const args = process.argv.slice(2); // Skip the first two entries
const url = args[0]; // First argument: URL of the webpage
const selector = args[1]; // Second argument: CSS selector for target content
const fileName = args[2]; // Third argument: File to store the last fetched content

if (!url || !selector || !fileName) {
  console.error(
    "Usage: ts-node checkWebpage.ts <URL> <CSS selector> <file name>"
  );
  process.exit(1);
}

const filePath = path.join("snapshots", fileName);

async function fetchWebpageContent() {
  try {
    const response = await axios.get<string>(url);
    const $ = cheerio.load(response.data);
    const targetContent = $(selector).html(); // Select the content based on the CSS selector
    return targetContent || ""; // Return empty string if selector finds no content
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

function displayDifferences(oldContent: string, newContent: string) {
  const changes = diff.diffLines(oldContent, newContent);
  changes.forEach((change) => {
    if (change.added) {
      console.log("Added: " + change.value);
    } else if (change.removed) {
      console.log("Removed: " + change.value);
    }
  });
}

async function checkForChanges() {
  const currentContent = await fetchWebpageContent();
  const lastContent = await readLastContent();

  if (lastContent !== null && currentContent !== lastContent) {
    console.log("Content has changed!");
    displayDifferences(lastContent, currentContent);
  } else {
    console.log("No changes detected.");
  }

  await writeContent(currentContent);
}

checkForChanges();
