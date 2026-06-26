const fs = require('fs');
const path = require('path');

const screens = [
  { "title": "Checkout", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzRiNDA2NTNmOTA3NzQ3ZDg4MDFjZTBlMGI2ODNlY2QwEgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "checkout_mobile.html" },
  { "title": "Product Details", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2RmZWMyMWMwM2NjZTQwMGU4YjYxOWM0MDM5ZTg4OWY3EgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "product_details_mobile.html" },
  { "title": "User Dashboard - Desktop", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2U1YjdjYjc3NmZmYjQyODBhZDY4N2FlYTAwYzk5MzU4EgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "user_dashboard_desktop.html" },
  { "title": "Search & Categories - Desktop", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2ZmMTM0YThlZTJkODQ3ODg4OWY0Y2FhZDkyZmQ2YTU4EgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "search_categories_desktop.html" },
  { "title": "Chat with Seller", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2JkYzgyMmZkNzQxNzQ3Y2Q5YzIwZmQzZGE2OTAyYjMyEgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "chat_seller_mobile.html" },
  { "title": "Search & Categories", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzViMDQwYTdjYzRmMzQyOWY5ZmZlMDZiZjFkMzdiMThkEgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "search_categories_mobile.html" },
  { "title": "KKMarket Home", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2ZkNTczYjljMGEyOTQxMjNiMjZkNjU4OWFiMzQ5MzMwEgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "home_mobile.html" },
  { "title": "Checkout - Desktop", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzA3NDY1NDE0M2Y4ZDRjNmI5MTUxMDQ4MDEwMGM0NThiEgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "checkout_desktop.html" },
  { "title": "KKMarket Home - Desktop", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzc5NWNlZGYxOWEwNTQ0ODg5YWNhNTU3YTkwNmYzNmUzEgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "home_desktop.html" },
  { "title": "Seller Profile", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Y2MTFiMTRkOWQzZDQzYzM4N2M3MDhjNjMwNGE5NmEwEgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "seller_profile_mobile.html" },
  { "title": "Product Details - Desktop", "url": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Y3NTRhODAxZjY5ZDQzYmQ4MzMzOGU2NzliNGZjNDc5EgsSBxDnhL2qhRYYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTgzODQ0MjEwNjUxMzA2NDk1MQ&filename=&opi=89354086", "name": "product_details_desktop.html" }
];

const targetDir = path.join(__dirname, 'kkmarket', 'stitch-imports');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadFiles() {
  for (const screen of screens) {
    try {
      console.log(`Downloading ${screen.name}...`);
      const response = await fetch(screen.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${screen.url}: ${response.statusText}`);
      }
      const html = await response.text();
      const filePath = path.join(targetDir, screen.name);
      fs.writeFileSync(filePath, html);
      console.log(`Saved ${screen.name}`);
    } catch (error) {
      console.error(`Error downloading ${screen.name}:`, error.message);
    }
  }
  console.log('All downloads finished.');
}

downloadFiles();
