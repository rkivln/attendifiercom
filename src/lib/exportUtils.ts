import { AttendanceEntry } from "@/contexts/AttendanceContext";
import { saveAs } from "file-saver";

export const exportToCSV = (entries: AttendanceEntry[], filename: string) => {
  const header = "Date & Time,Subject,Student Name,IP Address\n";
  const rows = entries
    .map((e) => `"${new Date(e.created_at).toLocaleString()}","${e.subject_code}","${e.student_name}","${e.ip_address}"`)
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
  saveAs(blob, `${filename}.csv`);
};

export const exportToWord = (entries: AttendanceEntry[], filename: string) => {
  let html = `<html><head><meta charset="utf-8"><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #333;padding:8px;text-align:left}th{background:#f0f0f0}</style></head><body>`;
  html += `<h2>Attendance Report - ${filename}</h2>`;
  html += `<table><tr><th>Date & Time</th><th>Subject</th><th>Student Name</th><th>IP Address</th></tr>`;
  entries.forEach((e) => {
    html += `<tr><td>${new Date(e.created_at).toLocaleString()}</td><td>${e.subject_code}</td><td>${e.student_name}</td><td>${e.ip_address}</td></tr>`;
  });
  html += `</table></body></html>`;
  const blob = new Blob([html], { type: "application/msword" });
  saveAs(blob, `${filename}.doc`);
};

export const exportToExcel = (entries: AttendanceEntry[], filename: string) => {
  let html = `<html><head><meta charset="utf-8"></head><body><table>`;
  html += `<tr><th>Date & Time</th><th>Subject</th><th>Student Name</th><th>IP Address</th></tr>`;
  entries.forEach((e) => {
    html += `<tr><td>${new Date(e.created_at).toLocaleString()}</td><td>${e.subject_code}</td><td>${e.student_name}</td><td>${e.ip_address}</td></tr>`;
  });
  html += `</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  saveAs(blob, `${filename}.xls`);
};
