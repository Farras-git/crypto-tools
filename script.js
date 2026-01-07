// =============================
// Utility
// =============================
function letterIndex(ch) {
  const c = ch.toUpperCase();
  if (c < "A" || c > "Z") return null;
  return c.charCodeAt(0) - 65;
}
function normalizeText(s) {
  return s.replace(/\s+/g, '').toUpperCase();
}
function mod(n, m) {
  return ((n % m) + m) % m;
}

// =============================
// ROT13
// =============================
function rot13Encrypt(text) {
  return text.replace(/[a-zA-Z]/g, function (c) {
    return String.fromCharCode(
      (c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13)
        ? c
        : c - 26
    );
  });
}
const rot13Decrypt = rot13Encrypt;

// =============================
// Atbash
// =============================
function atbashEncrypt(text) {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const R = "ZYXWVUTSRQPONMLKJIHGFEDCBA";
  let result = "";
  for (let ch of text.toUpperCase()) {
    result += A.includes(ch) ? R[A.indexOf(ch)] : ch;
  }
  return result;
}
const atbashDecrypt = atbashEncrypt;

// =============================
// Caesar
// =============================
function caesarEncrypt(text, shift) {
  let result = "";
  for (let ch of text.toUpperCase()) {
    const idx = letterIndex(ch);
    if (idx !== null) result += String.fromCharCode(65 + ((idx + shift) % 26));
    else result += ch;
  }
  return result;
}
function caesarDecrypt(text, shift) {
  return caesarEncrypt(text, 26 - shift);
}

// =============================
// Jam Cipher
// =============================
function jamEncrypt(text, step, hour, minute) {
  const clean = text.toUpperCase().replace(/\s+/g, "");
  let result = [];
  for (let i = 0; i < clean.length; i++) {
    result.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2,"0")}`);
    minute += step;
    if (minute >= 60) {
      hour += Math.floor(minute / 60);
      minute %= 60;
      if (hour > 12) hour -= 12;
    }
  }
  return result.join(" ");
}
function jamDecrypt(text) {
  return "Jam cipher tidak bisa didekripsi sempurna (one-way cipher).";
}

// =============================
// Transposition
// =============================
function transEncrypt(text, key) {
  const clean = text.replace(/\s+/g, "");
  let cols = Array.from({ length: key }, () => "");
  for (let i = 0; i < clean.length; i++) {
    cols[i % key] += clean[i];
  }
  return cols.join("");
}
function transDecrypt(text, key) {
  const clean = text.replace(/\s+/g, "");
  const numRows = Math.ceil(clean.length / key);
  const shortCols = key * numRows - clean.length;
  let cols = [];
  let start = 0;

  for (let i = 0; i < key; i++) {
    const len = i >= key - shortCols ? numRows - 1 : numRows;
    cols[i] = clean.slice(start, start + len);
    start += len;
  }

  let result = "";
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < key; c++) {
      if (cols[c][r]) result += cols[c][r];
    }
  }
  return result;
}

// =============================
// Random Transposisi
// =============================
function randomTransEncrypt(text, blockSize, keyOrder) {
  const key = keyOrder.split(",").map(Number);
  let clean = text.replace(/\s+/g, "");
  let result = "";

  for (let i=0; i < clean.length; i+=blockSize) {
    let block = clean.slice(i, i+blockSize).split("");
    let temp = [];
    for (let j=0; j<key.length; j++) {
      const pos = key[j]-1;
      if (pos < block.length) temp.push(block[pos]);
    }
    result += temp.join("");
  }
  return result;
}
function randomTransDecrypt(text, blockSize, keyOrder) {
  const key = keyOrder.split(",").map(Number);
  let clean = text.replace(/\s+/g, "");
  let result = "";

  for (let i=0; i < clean.length; i+=blockSize) {
    let block = clean.slice(i, i+blockSize).split("");
    let temp = Array(block.length);
    for (let j=0; j<key.length; j++) {
      const pos = key[j]-1;
      if (pos < block.length) temp[pos] = block[j];
    }
    result += temp.join("");
  }
  return result;
}

// =============================
// Vigenère
// =============================
function vigenereEncrypt(plaintext, key) {
  const P = normalizeText(plaintext);
  const K = normalizeText(key);
  let result = "";

  for (let i=0; i<P.length; i++) {
    const p = letterIndex(P[i]);
    const k = letterIndex(K[i % K.length]);
    result += String.fromCharCode(65 + ((p + k) % 26));
  }
  return result;
}
function vigenereDecrypt(cipher, key) {
  const C = normalizeText(cipher);
  const K = normalizeText(key);
  let result = "";

  for (let i=0; i<C.length; i++) {
    const c = letterIndex(C[i]);
    const k = letterIndex(K[i % K.length]);
    result += String.fromCharCode(65 + mod((c - k), 26));
  }
  return result;
}

// =============================
// DOCX Reader
// =============================
async function readDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// =============================
// DOCX Download (Preserve Multiline)
// =============================
async function downloadDocx(text) {
  const { Document, Packer, Paragraph } = docx;

  const lines = text.split("\n"); // pecah baris
  const paragraphs = lines.map(line => new Paragraph(line));

  const doc = new Document({
    sections: [{ children: paragraphs }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "crypto_output.docx");
}

// =============================
// UI Logic
// =============================
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("inputText");
  const output = document.getElementById("outputText");
  const algo = document.getElementById("algorithm");

  function updateVisibility() {
    document.getElementById("vigenereSettings").style.display = (algo.value === "vigenere" ? "block" : "none");
    document.getElementById("caesarSettings").style.display  = (algo.value === "caesar" ? "block" : "none");
    document.getElementById("jamSettings").style.display      = (algo.value === "jam" ? "block" : "none");
    document.getElementById("transSettings").style.display    = (algo.value === "transposition" ? "block" : "none");
    document.getElementById("randomTransSettings").style.display = (algo.value === "randomTransposition" ? "block" : "none");
  }
  algo.addEventListener("change", updateVisibility);
  updateVisibility();

  // =============================
  // UPLOAD FILE (.txt / .docx)
  // =============================
  document.getElementById("inputFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "txt") {
      const reader = new FileReader();
      reader.onload = ev => input.value = ev.target.result;
      reader.readAsText(file);
    }
    else if (ext === "docx") {
      const text = await readDocx(file);
      input.value = text;
    }
    else {
      alert("Format tidak didukung. Gunakan TXT atau DOCX.");
    }
  });

  // =============================
  // ENCRYPT
  // =============================
  document.getElementById("encryptBtn").addEventListener("click", () => {
    const text = input.value;
    let result = "";

    switch (algo.value) {
      case "rot13": result = rot13Encrypt(text); break;
      case "atbash": result = atbashEncrypt(text); break;
      case "caesar": result = caesarEncrypt(text, parseInt(caesarKey.value)); break;
      case "jam": result = jamEncrypt(text, parseInt(jamStep.value), parseInt(jamHour.value), parseInt(jamMinute.value)); break;
      case "transposition": result = transEncrypt(text, parseInt(transKey.value)); break;
      case "randomTransposition": result = randomTransEncrypt(text, parseInt(randomBlock.value), randomKey.value); break;
      case "vigenere": result = vigenereEncrypt(text, vigenereKey.value); break;
    }

    output.value = result;
  });

  // =============================
  // DECRYPT
  // =============================
  document.getElementById("decryptBtn").addEventListener("click", () => {
    const text = input.value;
    let result = "";

    switch (algo.value) {
      case "rot13": result = rot13Decrypt(text); break;
      case "atbash": result = atbashDecrypt(text); break;
      case "caesar": result = caesarDecrypt(text, parseInt(caesarKey.value)); break;
      case "jam": result = jamDecrypt(text); break;
      case "transposition": result = transDecrypt(text, parseInt(transKey.value)); break;
      case "randomTransposition": result = randomTransDecrypt(text, parseInt(randomBlock.value), randomKey.value); break;
      case "vigenere": result = vigenereDecrypt(text, vigenereKey.value); break;
    }

    output.value = result;
  });

  // =============================
  // Download TXT
  // =============================
  document.getElementById("downloadTxtBtn").addEventListener("click", () => {
    const blob = new Blob([output.value], { type: "text/plain" });
    saveAs(blob, "crypto_output.txt");
  });

  // =============================
  // Download DOCX (Multiline)
  // =============================
  document.getElementById("downloadDocxBtn").addEventListener("click", () => {
    downloadDocx(output.value);
  });

  // =============================
  // CLEAR BUTTON
  // =============================
  document.getElementById("clearBtn").addEventListener("click", () => {
    input.value = "";
    output.value = "";
    document.getElementById("inputFile").value = ""; // reset file picker
  });
});
