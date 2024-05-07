import axios, { AxiosError } from "axios";
import { promises as fs } from "fs";
import * as path from "path";
import * as diff from "diff";
import * as cheerio from "cheerio";

// Retrieve command line arguments
const args = process.argv.slice(2); // Skip the first two entries
const url = args[0]; // First argument: URL of the webpage
const selector = args[1]; // Second argument: CSS selector for target content
const fileName = args[2]; // Third argument: File to store the last fetched content
const webhookUrl = args[3]; // Fourth argument: Discord webhook URL

if (!url || !selector || !fileName || !webhookUrl) {
  console.error(
    "Usage: ts-node checkWebpage.ts <URL> <CSS selector> <file name> <webhook URL>"
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
  let changesSummary = "";
  changes.forEach((change) => {
    changesSummary += change.value;
  });
  return changesSummary;
}

async function sendDiscordAlert(message: string) {
  try {
    await axios({
      method: "POST",
      url: webhookUrl,
      headers: {
        "content-type": "application/json",
      },
      data: {
        content: message,
      },
    });
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("Failed to send Discord alert:", error.response?.data);
      return;
    }
    console.error("Failed to send Discord alert:", error);
  }
}

async function checkForChanges() {
  const currentContent = await fetchWebpageContent();
  const lastContent = await readLastContent();

  if (lastContent !== null && currentContent !== lastContent) {
    console.log("Content has changed!");
    const changes = displayDifferences(lastContent, currentContent);
    sendDiscordAlert(`Content has changed!\n${changes}`);
  } else {
    console.log("No changes detected.");
  }

  await writeContent(currentContent);
}

checkForChanges();
