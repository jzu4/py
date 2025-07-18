const GITHUB_TOKEN = "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";
const REPO_OWNER = "jzu4"; // عدّلها حسب اسم حسابك
const REPO_NAME = "py";    // عدّلها حسب اسم الريبو
const BRANCH = "main";     // أو master إذا كان الفرع هكذا
const FILE_PATH = "ips.json";

const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

async function fetchIPs() {
  let res = await fetch(apiUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
  let data = await res.json();
  let content = atob(data.content.replace(/\n/g, ''));
  return { content: JSON.parse(content), sha: data.sha };
}

function displayIPs(ips) {
  const container = document.getElementById('ips');
  if (!ips.length) {
    container.innerHTML = "<p>لا توجد زيارات بعد.</p>";
    return;
  }
  container.innerHTML = ips.slice().reverse().map(ip =>
    `<div class="ip-card">
      <span class="ip">IP: ${ip.ip}</span><br>
      <span class="time">الوقت: ${ip.time}</span><br>
      <span class="ua">${ip.user_agent}</span>
    </div>`
  ).join('');
}

async function addVisit() {
  document.getElementById('status').textContent = "جاري إضافة زيارتك...";
  try {
    let { content: ips, sha } = await fetchIPs();
    // احصل على الآي بي من خدمة خارجية بسيطة:
    let ipRes = await fetch('https://api.ipify.org?format=json');
    let ipData = await ipRes.json();
    let ip = ipData.ip;
    let time = new Date().toISOString();
    let ua = navigator.userAgent;

    ips.push({ ip, time, user_agent: ua });

    let newContent = btoa(unescape(encodeURIComponent(JSON.stringify(ips, null, 2))));
    let res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "اضافة زيارة جديدة",
        content: newContent,
        branch: BRANCH,
        sha: sha
      })
    });

    if (res.ok) {
      document.getElementById('status').textContent = "تمت إضافة زيارتك بنجاح!";
      fetchIPs().then(data => displayIPs(data.content));
    } else {
      document.getElementById('status').textContent = "فشل في الإضافة! تأكد من الإعدادات.";
    }
  } catch (e) {
    document.getElementById('status').textContent = "خطأ في الاتصال: " + e;
  }
}

// عند تحميل الصفحة اعرض الآيبيات
fetchIPs().then(data => displayIPs(data.content));
