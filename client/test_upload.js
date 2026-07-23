const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Go to login page
  await page.goto('http://localhost:3000/login/student');
  
  // Login
  await page.type('input[type="text"]', 'qa_student@test.com');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForNavigation();
  console.log("Logged in:", page.url());

  // Go to profile page
  await page.goto('http://localhost:3000/student/profile');
  await page.waitForSelector('input[type="file"]');
  console.log("On profile page.");

  // Create a dummy image
  fs.writeFileSync('dummy.png', 'fake image data');

  // Upload the image
  const inputUploadHandle = await page.$('input[type="file"]');
  await inputUploadHandle.uploadFile('dummy.png');

  // Wait a bit to see the result
  await new Promise(r => setTimeout(r, 2000));
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Authentication token is required')) {
    console.log("❌ Error reproduced: Authentication token is required");
  } else {
    console.log("Upload result seems different.");
    console.log(bodyText.substring(0, 500));
  }

  await browser.close();
})();
