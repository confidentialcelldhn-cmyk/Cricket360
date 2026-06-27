import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FinancialReportRow {
  studentName: string;
  batchName: string;
  month: string;
  amount: number;
  status: string;
  submittedAt?: string;
  verifiedAt?: string;
}

export interface AttendanceReportRow {
  date: string;
  batchName: string;
  studentName: string;
  status: string;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function escapeCSV(v: string | number | undefined | null): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function buildCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  return [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
}

// ─── Web CSV download ─────────────────────────────────────────────────────────

function webDownloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Native CSV share ─────────────────────────────────────────────────────────

async function nativeShareCSV(content: string, filename: string) {
  const uri = (FileSystem.cacheDirectory ?? "") + filename;
  await FileSystem.writeAsStringAsync(uri, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: `Share ${filename}` });
  }
}

// ─── Web PDF via jsPDF ────────────────────────────────────────────────────────

const NAVY: [number, number, number] = [10, 22, 40];   // #0A1628
const GOLD: [number, number, number] = [245, 158, 11]; // #F59E0B

function statusColor(status: string): [number, number, number] {
  const s = status.toLowerCase();
  if (s === "paid" || s === "present") return [22, 101, 52];
  if (s === "pending" || s === "late") return [133, 77, 14];
  return [153, 27, 27]; // unpaid / rejected / absent
}

async function webDownloadPDF(rows: (string | number)[][], head: string[], summaryLines: string[], title: string, filename: string, landscape: boolean) {
  // Dynamic import so it only loads on web
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  // Header bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Cricket360", 12, 10);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(title, 12, 16);
  doc.text(`Generated: ${now}`, pageW - 12, 10, { align: "right" });

  // Gold underline
  doc.setFillColor(...GOLD);
  doc.rect(0, 22, pageW, 1.2, "F");

  // Summary lines
  doc.setTextColor(...NAVY);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let sy = 30;
  summaryLines.forEach((line, i) => {
    doc.text(line, i % 2 === 0 ? 12 : pageW / 2, sy);
    if (i % 2 === 1) sy += 6;
  });
  if (summaryLines.length % 2 !== 0) sy += 6;

  // Table
  autoTable(doc, {
    startY: sy + 2,
    head: [head],
    body: rows,
    styles: { fontSize: 8.5, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: (data) => {
      if (data.section === "body") {
        const val = String(data.cell.raw ?? "");
        const statusCol = head.findIndex((h) => h === "Status");
        if (data.column.index === statusCol && val) {
          data.cell.styles.textColor = statusColor(val);
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: 12, right: 12 },
  });

  doc.save(filename);
}

// ─── Native PDF via expo-print → share ───────────────────────────────────────

async function nativeSharePDF(html: string, filename: string) {
  const { uri } = await Print.printToFileAsync({ html });
  // Rename the temp file to the desired filename
  const dest = (FileSystem.cacheDirectory ?? "") + filename;
  await FileSystem.copyAsync({ from: uri, to: dest });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(dest, { mimeType: "application/pdf", dialogTitle: `Save ${filename}` });
  }
}

function buildNativePdfHtml(title: string, subtitle: string, tableHtml: string, academyName: string, landscape: boolean): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  @page { size: ${landscape ? "A4 landscape" : "A4 portrait"}; margin: 18mm 14mm; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; }
  .hdr { background:#0A1628; color:#fff; padding:12px 16px; border-radius:5px; margin-bottom:14px; }
  .hdr h1 { margin:0 0 2px; font-size:16px; } .hdr p { margin:0; font-size:9px; opacity:0.65; }
  table { width:100%; border-collapse:collapse; margin-top:4px; }
  th { background:#0A1628; color:#fff; padding:7px 8px; text-align:left; font-size:9px; white-space:nowrap; }
  td { padding:5px 8px; border-bottom:1px solid #e2e8f0; font-size:9px; }
  tr:nth-child(even) td { background:#f8fafc; }
  .paid,.present { color:#166534; font-weight:bold; }
  .pending,.late  { color:#854d0e; font-weight:bold; }
  .unpaid,.absent,.rejected { color:#991b1b; font-weight:bold; }
  .sum { display:flex; gap:12px; margin-bottom:14px; }
  .sum-item { border:1px solid #e2e8f0; border-radius:5px; padding:8px 12px; }
  .sum-item .v { font-size:17px; font-weight:bold; color:#0A1628; }
  .sum-item .l { font-size:9px; color:#64748b; }
</style></head><body>
<div class="hdr"><h1>${academyName}</h1><p>${title} — ${subtitle}</p></div>
${tableHtml}
</body></html>`;
}

// ─── Financial CSV ────────────────────────────────────────────────────────────

export async function exportFinancialCSV(rows: FinancialReportRow[], label: string, filename: string) {
  const headers = ["Student Name", "Batch", "Month", "Amount (INR)", "Status", "Submitted On", "Verified On"];
  const data = rows.map((r) => [
    r.studentName, r.batchName, r.month, r.amount, r.status,
    r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-IN") : "",
    r.verifiedAt  ? new Date(r.verifiedAt).toLocaleDateString("en-IN")  : "",
  ]);
  const csv = buildCSV(headers, data);
  if (Platform.OS === "web") webDownloadCSV(csv, filename);
  else await nativeShareCSV(csv, filename);
}

// ─── Financial PDF ────────────────────────────────────────────────────────────

export async function exportFinancialPDF(rows: FinancialReportRow[], label: string, filename: string, academyName: string) {
  const paid      = rows.filter((r) => r.status === "Paid").length;
  const pending   = rows.filter((r) => r.status === "Pending").length;
  const unpaid    = rows.filter((r) => r.status === "Unpaid" || r.status === "Rejected").length;
  const collected = rows.filter((r) => r.status === "Paid").reduce((s, r) => s + r.amount, 0);

  if (Platform.OS === "web") {
    const head = ["Student Name", "Batch", "Month", "Amount (INR)", "Status", "Submitted On", "Verified On"];
    const body = rows.map((r) => [
      r.studentName, r.batchName, r.month,
      `INR ${r.amount.toLocaleString("en-IN")}`,
      r.status,
      r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-IN") : "—",
      r.verifiedAt  ? new Date(r.verifiedAt).toLocaleDateString("en-IN")  : "—",
    ]);
    const summary = [
      `Paid: ${paid}`, `Pending: ${pending}`,
      `Unpaid/Rejected: ${unpaid}`, `Collected: INR ${collected.toLocaleString("en-IN")}`,
      `Total Students: ${rows.length}`, `Period: ${label}`,
    ];
    await webDownloadPDF(body, head, summary, `Fee Collection Report — ${label}`, filename, true);
  } else {
    const tableRows = rows.map((r) => `
      <tr>
        <td>${r.studentName}</td><td>${r.batchName}</td><td>${r.month}</td>
        <td>INR ${r.amount.toLocaleString("en-IN")}</td>
        <td class="${r.status.toLowerCase()}">${r.status}</td>
        <td>${r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-IN") : "—"}</td>
        <td>${r.verifiedAt  ? new Date(r.verifiedAt).toLocaleDateString("en-IN")  : "—"}</td>
      </tr>`).join("");
    const sumHtml = `<div class="sum">
      <div class="sum-item"><div class="v" style="color:#166534">${paid}</div><div class="l">Paid</div></div>
      <div class="sum-item"><div class="v" style="color:#854d0e">${pending}</div><div class="l">Pending</div></div>
      <div class="sum-item"><div class="v" style="color:#991b1b">${unpaid}</div><div class="l">Unpaid/Rejected</div></div>
      <div class="sum-item"><div class="v">INR ${collected.toLocaleString("en-IN")}</div><div class="l">Collected</div></div>
    </div>`;
    const tableHtml = `${sumHtml}<table>
      <thead><tr><th>Student Name</th><th>Batch</th><th>Month</th><th>Amount</th><th>Status</th><th>Submitted On</th><th>Verified On</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>`;
    const html = buildNativePdfHtml("Fee Collection Report", label, tableHtml, academyName, true);
    await nativeSharePDF(html, filename);
  }
}

// ─── Attendance CSV ───────────────────────────────────────────────────────────

export async function exportAttendanceCSV(rows: AttendanceReportRow[], label: string, filename: string) {
  const headers = ["Date", "Batch", "Student Name", "Status"];
  const data = rows.map((r) => [r.date, r.batchName, r.studentName, r.status]);
  const csv = buildCSV(headers, data);
  if (Platform.OS === "web") webDownloadCSV(csv, filename);
  else await nativeShareCSV(csv, filename);
}

// ─── Attendance PDF ───────────────────────────────────────────────────────────

export async function exportAttendancePDF(rows: AttendanceReportRow[], label: string, filename: string, academyName: string) {
  const present = rows.filter((r) => r.status === "Present").length;
  const absent  = rows.filter((r) => r.status === "Absent").length;
  const late    = rows.filter((r) => r.status === "Late").length;
  const rate    = rows.length > 0 ? Math.round((present / rows.length) * 100) : 0;

  if (Platform.OS === "web") {
    const head = ["Date", "Batch", "Student Name", "Status"];
    const body = rows.map((r) => [r.date, r.batchName, r.studentName, r.status]);
    const summary = [
      `Present: ${present}`, `Absent: ${absent}`,
      `Late: ${late}`, `Attendance Rate: ${rate}%`,
      `Total Entries: ${rows.length}`, `Period: ${label}`,
    ];
    await webDownloadPDF(body, head, summary, `Attendance Report — ${label}`, filename, false);
  } else {
    const tableRows = rows.map((r) => `
      <tr>
        <td>${r.date}</td><td>${r.batchName}</td><td>${r.studentName}</td>
        <td class="${r.status.toLowerCase()}">${r.status}</td>
      </tr>`).join("");
    const sumHtml = `<div class="sum">
      <div class="sum-item"><div class="v" style="color:#166534">${present}</div><div class="l">Present</div></div>
      <div class="sum-item"><div class="v" style="color:#991b1b">${absent}</div><div class="l">Absent</div></div>
      <div class="sum-item"><div class="v" style="color:#854d0e">${late}</div><div class="l">Late</div></div>
      <div class="sum-item"><div class="v">${rate}%</div><div class="l">Attendance Rate</div></div>
    </div>`;
    const tableHtml = `${sumHtml}<table>
      <thead><tr><th>Date</th><th>Batch</th><th>Student Name</th><th>Status</th></tr></thead>
      <tbody>${tableRows}</tbody>
    </table>`;
    const html = buildNativePdfHtml("Attendance Report", label, tableHtml, academyName, false);
    await nativeSharePDF(html, filename);
  }
}
