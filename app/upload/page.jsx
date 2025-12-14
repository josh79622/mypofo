"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | presigning | uploading | done | error
  const [progress, setProgress] = useState(0);
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  async function getPresignedUrl(selectedFile) {
    const res = await fetch("/api/r2/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: selectedFile.name,
        contentType: selectedFile.type || "application/octet-stream",
        size: selectedFile.size,
      }),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`presign failed: ${res.status} ${msg}`);
    }
    return res.json(); // { url, key }
  }

  function uploadWithProgress(url, selectedFile) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);

      xhr.setRequestHeader(
        "Content-Type",
        selectedFile.type || "application/octet-stream"
      );

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`upload failed: ${xhr.status}`));
      };

      xhr.onerror = () => reject(new Error("network error"));
      xhr.send(selectedFile);
    });
  }

  async function onUpload() {
    setError("");
    setKey("");
    setProgress(0);

    if (!file) {
      setError("請先選擇檔案");
      return;
    }

    try {
      setStatus("presigning");
      const { url, key } = await getPresignedUrl(file);

      setStatus("uploading");
      await uploadWithProgress(url, file);

      setKey(key);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Upload error");
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 600 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Upload to R2</h1>

      <div style={{ marginTop: 16 }}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <button
        onClick={onUpload}
        disabled={status === "presigning" || status === "uploading"}
        style={{ marginTop: 12, padding: "8px 12px", cursor: "pointer" }}
      >
        {status === "presigning"
          ? "產生上傳連結中..."
          : status === "uploading"
          ? "上傳中..."
          : "開始上傳"}
      </button>

      <div style={{ marginTop: 16 }}>
        <div>Progress: {progress}%</div>
        <div
          style={{
            height: 10,
            background: "#eee",
            borderRadius: 8,
            overflow: "hidden",
            marginTop: 6,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "#333",
            }}
          />
        </div>
      </div>

      {status === "done" && (
        <div style={{ marginTop: 16 }}>
          ✅ 上傳成功！<br />
          <div style={{ marginTop: 8, fontFamily: "monospace" }}>{key}</div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 16, color: "crimson" }}>❌ {error}</div>
      )}
    </main>
  );
}
