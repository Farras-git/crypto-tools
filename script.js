// ---------- Utility ----------
function pad2(n) { return n.toString().padStart(2, "0"); }
function validateStep(step) { return Number.isInteger(step) && step > 0 && step < 60 && (60 % step) === 0; }
function letterIndex(ch) {
  const c = ch.toUpperCase();
  if (c < "A" || c > "Z") return null;
  return c.charCodeAt(0) - 65;
}

// ---------- Atbash ----------
function atbash(text) {
  const A = "A".charCodeAt(0);
  return text.split("").map(ch => {
    const up = ch.toUpperCase();
    if (up >= "A" && up <= "Z") {
      const idx = up.charCodeAt(0) - A;
      const rev = String.fromCharCode(A + (25 - idx));
      return (ch === ch.toLowerCase()) ? rev.toLowerCase() : rev;
    }
    return ch;
  }).join("");
}

// ---------- ROT13 ----------
function rot13(text) {
  return text.replace(/[a-zA-Z]/g, c => {
    const code = c.charCodeAt(0);
    const base = (code >= 65 && code <= 90) ? 65 : 97;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

// ---------- Caesar Cipher ----------
function caesarEncrypt(text, key) {
  return text.replace(/[a-zA-Z]/g, c => {
    const code = c.charCodeAt(0);
    const base = (code >= 65 && code <= 90) ? 65 : 97;
    return String.fromCharCode(((code - base + key) % 26) + base);
  });
}
function caesarDecrypt(text, key) {
  return caesarEncrypt(text, 26 - key);
}

// ---------- Jam Cipher ----------
function jamEncryptDet(text, step, startHour, startMinute) {
  if (!validateStep(step)) return "Error: step harus pembagi 60!";
  const baseTotal = ((startHour % 12) * 60 + startMinute) % 720;
  const tokens = [];
  for (let ch of text) {
    if (ch === " ") { tokens.push("00:00"); continue; }
    const idx = letterIndex(ch);
    if (idx === null) { tokens.push(ch); continue; }
    const total = (baseTotal + idx * step) % 720;
    let h = Math.floor(total / 60);
    let m = total % 60;
    let displayHour = (h === 0) ? 12 : h;
    tokens.push(pad2(displayHour) + ":" + pad2(m));
  }
  return tokens.join(" ");
}

function jamDecryptDet(tokenStr, step, startHour, startMinute) {
  if (!validateStep(step)) return "Error: step harus pembagi 60!";
  const baseTotal = ((startHour % 12) * 60 + startMinute) % 720;
  const rawTokens = tokenStr.split(" ").filter(t => t.length > 0);
  const chars = [];
  for (let t of rawTokens) {
    if (t === "00:00") { chars.push(" "); continue; }
    if (!t.includes(":")) { chars.push(t); continue; }
    const [hh, mm] = t.split(":").map(Number);
    let hInternal = (hh === 12) ? 0 : hh;
    const total = (hInternal * 60 + mm) % 720;
    const diff = (total - baseTotal + 720) % 720;
    if (diff % step !== 0) { chars.push("?"); continue; }
    const idx = (diff / step) % 26;
    chars.push(String.fromCharCode(65 + idx));
  }
  return chars.join("");
}

// ---------- Transposition Cipher ----------
function normalizeText(s) {
  return s.replace(/\s+/g, '').toUpperCase();
}

function transEncrypt(text, key) {
  const plain = normalizeText(text);
  const cols = parseInt(key, 10);
  if (isNaN(cols) || cols < 2) return "Error: key minimal 2";

  const rows = Math.ceil(plain.length / cols);
  const pad = 'X';
  const grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const idx = r * cols + c;
      return idx < plain.length ? plain[idx] : pad;
    })
  );

  let result = "";
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) result += grid[r][c];
  }
  return result;
}

function transDecrypt(text, key) {
  const cipher = normalizeText(text);
  const cols = parseInt(key, 10);
  if (isNaN(cols) || cols < 2) return "Error: key minimal 2";

  const rows = Math.ceil(cipher.length / cols);
  const pad = 'X';
  const grid = Array.from({ length: rows }, () => Array(cols).fill(''));
  let idx = 0;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      grid[r][c] = idx < cipher.length ? cipher[idx++] : pad;
    }
  }

  let result = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) result += grid[r][c];
  }
  return result.replace(/X+$/, '');
}

// ---------- UI Logic ----------
document.addEventListener("DOMContentLoaded", () => {
  const algorithmSelect = document.getElementById("algorithm");
  const jamSettings = document.getElementById("jamSettings");
  const caesarSettings = document.getElementById("caesarSettings");
  const transSettings = document.getElementById("transSettings");
  const inputEl = document.getElementById("inputText");
  const outputEl = document.getElementById("outputText");
  const encryptBtn = document.getElementById("encryptBtn");
  const decryptBtn = document.getElementById("decryptBtn");

  function updateVisibility() {
    jamSettings.style.display = (algorithmSelect.value === "jam") ? "block" : "none";
    caesarSettings.style.display = (algorithmSelect.value === "caesar") ? "block" : "none";
    transSettings.style.display = (algorithmSelect.value === "transposition") ? "block" : "none";
  }

  algorithmSelect.addEventListener("change", updateVisibility);
  updateVisibility();

  function readJamParams() {
    return {
      step: parseInt(document.getElementById("jamStep").value, 10),
      hour: parseInt(document.getElementById("jamHour").value, 10),
      minute: parseInt(document.getElementById("jamMinute").value, 10)
    };
  }

  encryptBtn.addEventListener("click", () => {
    const text = inputEl.value;
    let result = "";

    switch (algorithmSelect.value) {
      case "rot13": result = rot13(text); break;
      case "atbash": result = atbash(text); break;
      case "caesar":
        result = caesarEncrypt(text, parseInt(document.getElementById("caesarKey").value, 10));
        break;
      case "jam":
        const { step, hour, minute } = readJamParams();
        result = jamEncryptDet(text, step, hour, minute);
        break;
      case "transposition":
        const keyT = parseInt(document.getElementById("transKey").value, 10);
        result = transEncrypt(text, keyT);
        break;
    }
    outputEl.value = result;
  });

  decryptBtn.addEventListener("click", () => {
    const text = inputEl.value;
    let result = "";

    switch (algorithmSelect.value) {
      case "rot13": result = rot13(text); break;
      case "atbash": result = atbash(text); break;
      case "caesar":
        result = caesarDecrypt(text, parseInt(document.getElementById("caesarKey").value, 10));
        break;
      case "jam":
        const { step, hour, minute } = readJamParams();
        result = jamDecryptDet(text, step, hour, minute);
        break;
      case "transposition":
        const keyT = parseInt(document.getElementById("transKey").value, 10);
        result = transDecrypt(text, keyT);
        break;
    }
    outputEl.value = result;
  });
});
