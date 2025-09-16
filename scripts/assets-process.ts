import * as fs from "node:fs";
import * as path from "node:path";
import * as cheerio from "cheerio";
import {
  blockPageTranslations,
  challengePageTranslations,
  errorPageTranslations,
} from "../config/i18n";

function getAllHtmlFiles(dirPath: string): string[] {
  const files: string[] = [];

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllHtmlFiles(fullPath));
    } else if (path.extname(fullPath) === ".html") {
      files.push(fullPath);
    }
  }

  return files;
}

function processHtmlFile(filePath: string): void {
  try {
    const html = fs.readFileSync(filePath, "utf-8");
    const $ = cheerio.load(html);

    $('link[rel="preload"]').each((_, element) => {
      const $element = $(element);
      const as = $element.attr("as");

      if (as === "style") {
        $element.attr("rel", "stylesheet");
        $element.removeAttr("as");
      } else if (as === "font") {
        $element.remove();
      }
    });

    updateTDK($, filePath);

    // 添加 Cloudflare meta 标签，仅对 out/cf/ 目录下的 HTML 文件处理
    if (filePath.includes(path.join("out", "cf"))) {
      addCloudflareMetaTags($);
    }

    // Move all script tags from head to bottom of body
    moveScriptsToBodyBottom($);

    fs.writeFileSync(filePath, $.html());
    console.log(`Processed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

function updateTDK($: cheerio.CheerioAPI, filePath: string): void {
  const pathParts = filePath.split(path.sep);
  const cfIndex = pathParts.findIndex((part) => part === "cf");

  if (cfIndex === -1 || cfIndex + 2 >= pathParts.length) {
    return;
  }

  const directory = pathParts[cfIndex + 1];
  const type = pathParts[cfIndex + 2];

  let pageTitle = "";
  let pageDescription = "";

  if (directory === "block" && type in blockPageTranslations) {
    pageTitle = blockPageTranslations[type].title;
    pageDescription = blockPageTranslations[type].message;
  } else if (directory === "error" && type in errorPageTranslations) {
    pageTitle = errorPageTranslations[type].title;
    pageDescription = errorPageTranslations[type].message;
  } else if (directory === "challenge" && type in challengePageTranslations) {
    pageTitle = challengePageTranslations[type].title;
    pageDescription = challengePageTranslations[type].message;
  }

  if (pageTitle) {
    $("title").text(`${pageTitle} - Cloudflare`);
  }

  if (pageDescription) {
    const descriptionMeta = $('meta[name="description"]');
    if (descriptionMeta.length > 0) {
      descriptionMeta.attr("content", pageDescription);
    } else {
      $("head").append(
        `<meta name="description" content="${pageDescription}">`,
      );
    }
  }

  const keywordsMeta = $('meta[name="keywords"]');
  if (keywordsMeta.length === 0) {
    $("head").append(
      '<meta name="keywords" content="Cloudflare, security, WAF, protection">',
    );
  }
}

/**
 * Add Cloudflare-specific meta tags to the top of head section in HTML files
 * - client-ip: ::CLIENT_IP::
 * - ray-id: ::RAY_ID::
 * - location-code: ::GEO::
 * - build-date: Current build timestamp
 * - version: Package version from package.json
 */
function addCloudflareMetaTags($: cheerio.CheerioAPI): void {
  const packagePath = path.join(__dirname, "../package.json");
  let version = "unknown";

  try {
    const packageContent = fs.readFileSync(packagePath, "utf-8");
    const packageJson = JSON.parse(packageContent);
    version = packageJson.version || "unknown";
  } catch (error) {
    console.warn("Failed to read package.json version:", error);
  }

  const buildDate = new Date().toISOString();

  $("head").prepend(`
    <meta name="client-ip" content="::CLIENT_IP::">
    <meta name="ray-id" content="::RAY_ID::">
    <meta name="location-code" content="::GEO::">
    <meta name="build-date" content="${buildDate}">
    <meta name="version" content="${version}">
  `);
}

/**
 * Move all script tags from head to the bottom of body
 */
function moveScriptsToBodyBottom($: cheerio.CheerioAPI): void {
  // Find all script tags in the head
  const headScripts = $("head script");

  if (headScripts.length === 0) {
    return;
  }

  // Create an array to preserve script order
  const scriptElements: cheerio.Element[] = [];

  headScripts.each((_, element) => {
    scriptElements.push(element);
  });

  // Remove scripts from head
  headScripts.remove();

  // Append all scripts to the bottom of body (before the closing body tag)
  for (const script of scriptElements) {
    $("body").append(script);
  }
}

function main() {
  const outDir = "./out";

  try {
    if (!fs.existsSync(outDir)) {
      console.error("Directory ./out does not exist");
      return;
    }

    const htmlFiles = getAllHtmlFiles(outDir);

    for (const file of htmlFiles) {
      processHtmlFile(file);
    }

    console.log("All files processed successfully!");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
