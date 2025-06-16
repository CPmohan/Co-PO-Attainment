
import React, { useState, useRef, useEffect } from "react";
import Button from "../../../compounds/button";
import BasicsTable from "../../../compounds/tables/basics";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useExcelDataLab } from './ExcelDataContextlab';

// Helper functions needed for summary calculations (consolidated from other files)
const getSummaryAttainmentLevel = (percentageOfStudentsAchieved) => {
    const numericPercentage = parseFloat(percentageOfStudentsAchieved);
    if (isNaN(numericPercentage)) return "";
    if (numericPercentage >= 70) return 3;
    if (numericPercentage >= 60) return 2;
    if (numericPercentage >= 50) return 1;
    return 0;
};

const getIndividualAttainmentLevel = (percentage) => {
    const numericPercentage = parseFloat(percentage);
    if (isNaN(numericPercentage)) return "";
    if (numericPercentage >= 60) return 1;
    return 0;
};

// --- START: MODIFIED FUNCTION ---
// Now accepts an array of COs to check, making it reusable and specific.
const findLowestAttainmentCO = (attainmentLevelsSummary, relevantCOs) => {
    let lowestAttainment = Infinity;
    let lowestCO = '';
    
    for (const co of relevantCOs) {
        if (attainmentLevelsSummary.hasOwnProperty(co)) {
            const level = attainmentLevelsSummary[co];
            if (typeof level === 'number' && !isNaN(level)) {
                if (level < lowestAttainment) {
                    lowestAttainment = level;
                    lowestCO = co;
                }
            }
        }
    }
    return lowestCO;
};
// --- END: MODIFIED FUNCTION ---

const getAttainmentLevelFromPercentage = (percentage) => {
    if (percentage >= 70) return "3";
    if (percentage >= 60) return "2";
    if (percentage >= 50) return "1";
    return "0";
};

const calculateAttainmentLevelForIP = (achieved, total) => {
    const numericAchieved = parseFloat(achieved);
    if (isNaN(numericAchieved)) return "";
    if (total !== null && total !== undefined) {
        const numericTotal = parseFloat(total);
        if (isNaN(numericTotal) || numericTotal === 0) return "";
        const percentage = (numericAchieved / numericTotal) * 100;
        return getAttainmentLevelFromPercentage(percentage);
    } else {
        return getAttainmentLevelFromPercentage(numericAchieved);
    }
};


function Theorylab() {
  const { uploadedExcelData, uploadedHeaders, setOriginalExcelData } = useExcelDataLab();
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [displayExcelData, setDisplayExcelData] = useState(uploadedExcelData);
  const [displayHeaders, setDisplayHeaders] = useState(uploadedHeaders);

  useEffect(() => {
    if (uploadedExcelData.length > 0 && displayExcelData.length === 0) {
      setDisplayExcelData(uploadedExcelData);
      setDisplayHeaders(uploadedHeaders);
    }
  }, [uploadedExcelData, uploadedHeaders, displayExcelData]);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      const keys = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

      setOriginalExcelData(jsonData, keys);
      setDisplayExcelData(jsonData);
      setDisplayHeaders(keys);
    };

    reader.readAsArrayBuffer(file);
  };

    const convertTest1Data = (dataToConvert) => {
        return dataToConvert.map((row) => {
            const sno = row["S. No."] !== undefined ? row["S. No."] : row["S.No"] || "";
            const regNo = row["Reg. No."] || "";
            const name = row["Name"] || "";
            const pt1Value = row["PT1 (50)"];
            const isAbsent = String(pt1Value).toLowerCase() === "ab" || String(pt1Value).toLowerCase() === "absent";

            if (isAbsent) {
                return { "S.No": sno, "Reg.No": regNo, "Name": name, "MARKS ALLOCATED CO1": 20, "MARKS ALLOCATED CO2": 20, "MARKS ALLOCATED CO3": 10, "MARKS ALLOCATED CO4": "", "MARKS ALLOCATED CO5": "", "MARKS OBTAINED CO1": 0, "MARKS OBTAINED CO2": 0, "MARKS OBTAINED CO3": 0, "MARKS OBTAINED CO4": "", "MARKS OBTAINED CO5": "", "CO ATTAINMENT % CO1": 0, "CO ATTAINMENT % CO2": 0, "CO ATTAINMENT % CO3": 0, "CO ATTAINMENT % CO4": "", "CO ATTAINMENT % CO5": "", PT1: "AB" };
            }
            const pt1Marks = parseInt(pt1Value) || 0;
            const co1Marks = Math.min(20, Math.floor(pt1Marks * (20 / 50)));
            const remainingAfterCO1 = pt1Marks - co1Marks;
            const co2Marks = Math.min(20, Math.floor(remainingAfterCO1 * (20 / 30)));
            const remainingAfterCO2 = remainingAfterCO1 - co2Marks;
            const co3Marks = Math.min(10, remainingAfterCO2);
            const co1Percent = Math.round((co1Marks / 20) * 100);
            const co2Percent = Math.round((co2Marks / 20) * 100);
            const co3Percent = Math.round((co3Marks / 10) * 100);

            return { "S.No": sno, "Reg.No": regNo, "Name": name, "MARKS ALLOCATED CO1": 20, "MARKS ALLOCATED CO2": 20, "MARKS ALLOCATED CO3": 10, "MARKS ALLOCATED CO4": "", "MARKS ALLOCATED CO5": "", "MARKS OBTAINED CO1": co1Marks, "MARKS OBTAINED CO2": co2Marks, "MARKS OBTAINED CO3": co3Marks, "MARKS OBTAINED CO4": "", "MARKS OBTAINED CO5": "", "CO ATTAINMENT % CO1": co1Percent, "CO ATTAINMENT % CO2": co2Percent, "CO ATTAINMENT % CO3": co3Percent, "CO ATTAINMENT % CO4": "", "CO ATTAINMENT % CO5": "", PT1: pt1Marks };
        });
    };

    const convertTest2Data = (dataToConvert) => {
        return dataToConvert.map((row) => {
            const sno = row["S. No."] !== undefined ? row["S. No."] : row["S.No"] || "";
            const regNo = row["Reg. No."] || "";
            const name = row["Name"] || "";
            const pt2Value = row["PT2 (50)"];
            const isAbsent = String(pt2Value).toLowerCase() === "ab" || String(pt2Value).toLowerCase() === "absent";

            if (isAbsent) {
                return { "S.No": sno, "Reg.No": regNo, "Name": name, "MARKS ALLOCATED CO1": "", "MARKS ALLOCATED CO2": "", "MARKS ALLOCATED CO3": 10, "MARKS ALLOCATED CO4": 20, "MARKS ALLOCATED CO5": 20, "MARKS OBTAINED CO1": "", "MARKS OBTAINED CO2": "", "MARKS OBTAINED CO3": 0, "MARKS OBTAINED CO4": 0, "MARKS OBTAINED CO5": 0, "CO ATTAINMENT % CO1": "", "CO ATTAINMENT % CO2": "", "CO ATTAINMENT % CO3": 0, "CO ATTAINMENT % CO4": 0, "CO ATTAINMENT % CO5": 0, PT2: "AB" };
            }
            const pt2Marks = parseInt(pt2Value) || 0;
            const co3Marks = Math.min(10, Math.floor(pt2Marks * (10 / 50)));
            const remainingAfterCO3 = pt2Marks - co3Marks;
            const co4Marks = Math.min(20, Math.floor(remainingAfterCO3 * (20 / 40)));
            const remainingAfterCO4 = remainingAfterCO3 - co4Marks;
            const co5Marks = Math.min(20, remainingAfterCO4);
            const co3Percent = Math.round((co3Marks / 10) * 100);
            const co4Percent = Math.round((co4Marks / 20) * 100);
            const co5Percent = Math.round((co5Marks / 20) * 100);
            return { "S.No": sno, "Reg.No": regNo, "Name": name, "MARKS ALLOCATED CO1": "", "MARKS ALLOCATED CO2": "", "MARKS ALLOCATED CO3": 10, "MARKS ALLOCATED CO4": 20, "MARKS ALLOCATED CO5": 20, "MARKS OBTAINED CO1": "", "MARKS OBTAINED CO2": "", "MARKS OBTAINED CO3": co3Marks, "MARKS OBTAINED CO4": co4Marks, "MARKS OBTAINED CO5": co5Marks, "CO ATTAINMENT % CO1": "", "CO ATTAINMENT % CO2": "", "CO ATTAINMENT % CO3": co3Percent, "CO ATTAINMENT % CO4": co4Percent, "CO ATTAINMENT % CO5": co5Percent, PT2: pt2Marks };
        });
    };

    const convertIPData = (dataToConvert) => {
        return dataToConvert.map((row) => {
            const sno = row["S. No."] !== undefined ? row["S. No."] : row["S.No"] || "";
            const regNo = row["Reg. No."] || "";
            const name = row["Name"] || "";
            const ip16Value = row["IP (20)"];
            const isIPAbsent = String(ip16Value).toLowerCase() === "ab" || String(ip16Value).toLowerCase() === "absent";
            const ip16Total = isIPAbsent ? 0 : parseInt(ip16Value) || 0;
            const ip1 = Math.floor(ip16Total / 2);
            const ip2 = Math.ceil(ip16Total / 2);

            return { "S.No": sno, "Reg. No.": regNo, "Name": name, "IP1": isIPAbsent ? "AB" : ip1, "IP2": isIPAbsent ? "AB" : ip2, "IP (20)": isIPAbsent ? "AB" : ip16Total };
        });
    };

    // --- START: MODIFIED FUNCTION ---
    // Corrected to use 10 marks for IP1
    const convertIP1COAttainmentData = (ipData, lowestTest1CO) => {
        return ipData.map(row => {
            const isAbsent = String(row["IP1"]).toLowerCase() === 'ab' || String(row["IP1"]).toLowerCase() === 'absent';
            const ipMarks = isAbsent ? 'AB' : parseInt(row["IP1"], 10);
            const marksAllocated = 10; // FIX: Corrected from 8 to 10
            const marksObtained = isAbsent ? 0 : ipMarks;
            const attainmentPercent = isAbsent || marksAllocated === 0 ? 0 : Math.round((marksObtained / marksAllocated) * 100);

            const result = {
                "S.No": row["S.No"], "Reg.No": row["Reg. No."], "IP1 Marks": row["IP1"],
                "MARKS ALLOCATED CO1": "", "MARKS ALLOCATED CO2": "", "MARKS ALLOCATED CO3": "", "MARKS ALLOCATED CO4": "", "MARKS ALLOCATED CO5": "",
                "MARKS OBTAINED CO1": "", "MARKS OBTAINED CO2": "", "MARKS OBTAINED CO3": "", "MARKS OBTAINED CO4": "", "MARKS OBTAINED CO5": "",
                "CO ATTAINMENT % CO1": "", "CO ATTAINMENT % CO2": "", "CO ATTAINMENT % CO3": "", "CO ATTAINMENT % CO4": "", "CO ATTAINMENT % CO5": "",
            };
            result[`MARKS ALLOCATED ${lowestTest1CO}`] = marksAllocated;
            result[`MARKS OBTAINED ${lowestTest1CO}`] = marksObtained;
            result[`CO ATTAINMENT % ${lowestTest1CO}`] = attainmentPercent;
            return result;
        });
    };
    // --- END: MODIFIED FUNCTION ---


    const convertIP2COAttainmentData = (ipData, lowestTest2CO) => {
        return ipData.map(row => {
            const isAbsent = String(row["IP2"]).toLowerCase() === 'ab' || String(row["IP2"]).toLowerCase() === 'absent';
            const ipMarks = isAbsent ? 'AB' : parseInt(row["IP2"], 10);
            const marksAllocated = 10;
            const marksObtained = isAbsent ? 0 : ipMarks;
            const attainmentPercent = isAbsent || marksAllocated === 0 ? 0 : Math.round((marksObtained / marksAllocated) * 100);

            const result = {
                "S.No": row["S.No"], "Reg.No": row["Reg. No."], "IP2 Marks": row["IP2"],
                "MARKS ALLOCATED CO1": "", "MARKS ALLOCATED CO2": "", "MARKS ALLOCATED CO3": "", "MARKS ALLOCATED CO4": "", "MARKS ALLOCATED CO5": "",
                "MARKS OBTAINED CO1": "", "MARKS OBTAINED CO2": "", "MARKS OBTAINED CO3": "", "MARKS OBTAINED CO4": "", "MARKS OBTAINED CO5": "",
                "CO ATTAINMENT % CO1": "", "CO ATTAINMENT % CO2": "", "CO ATTAINMENT % CO3": "", "CO ATTAINMENT % CO4": "", "CO ATTAINMENT % CO5": "",
            };
            result[`MARKS ALLOCATED ${lowestTest2CO}`] = marksAllocated;
            result[`MARKS OBTAINED ${lowestTest2CO}`] = marksObtained;
            result[`CO ATTAINMENT % ${lowestTest2CO}`] = attainmentPercent;
            return result;
        });
    };


   const handleTest1Click = () => {
        const data = convertTest1Data(uploadedExcelData);
        navigate("/test1-lab-results", { state: { convertedData: data } });
    };

  const handleTest2Click = () => {
        const data = convertTest2Data(uploadedExcelData);
        navigate("/test2-lab-results", { state: { convertedData: data } });
    };

    const handleIPClick = () => {
        const data = convertIPData(uploadedExcelData);
        navigate("/ip-lab-results", { state: { convertedData: data } });
    };

  const handleDownloadAllData = () => {
    if (uploadedExcelData.length === 0) {
        alert("Please upload an Excel file first.");
        return;
    }

    const wb = XLSX.utils.book_new();
    const targetCOPercent = 60;
    let lowestTest1CO = "CO2"; // Default for IP1
    let lowestTest2CO = "CO4"; // Default for IP2

    // --- Process Test 1 ---
    const test1Data = convertTest1Data(uploadedExcelData);
    if (test1Data.length > 0) {
        const ws = {};
        const merges = [];
        let currentRow = 0;

        // Calculate Summary for Test 1
        let totalStudentsPresentForPT1 = 0;
        test1Data.forEach(row => {
            if (String(row["PT1"]).toLowerCase() !== "ab" && String(row["PT1"]).toLowerCase() !== "absent") {
                totalStudentsPresentForPT1++;
            }
        });

        const achievedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const totalAttendedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const remedialCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };

        test1Data.forEach(row => {
            if (String(row["PT1"]).toLowerCase() !== "ab" && String(row["PT1"]).toLowerCase() !== "absent") {
                ["CO1", "CO2", "CO3"].forEach(co => { // Only CO1, CO2, CO3 for Test 1
                    if (parseFloat(row[`MARKS ALLOCATED ${co}`]) > 0) {
                        totalAttendedCounts[co]++;
                        if (parseFloat(row[`CO ATTAINMENT % ${co}`]) >= targetCOPercent) {
                            achievedCounts[co]++;
                        } else {
                            remedialCounts[co]++;
                        }
                    }
                });
            }
        });

        const attainmentLevelsSummary = {};
        for (const co in achievedCounts) {
            if (totalAttendedCounts[co] > 0) {
                const percentageOfStudentsAchieved = (achievedCounts[co] / totalAttendedCounts[co]) * 100;
                attainmentLevelsSummary[co] = getSummaryAttainmentLevel(percentageOfStudentsAchieved);
            } else {
                attainmentLevelsSummary[co] = "";
            }
        }
        
        // FIX: Use the specific logic for Test 1 (only compare CO1 and CO2)
        lowestTest1CO = findLowestAttainmentCO(attainmentLevelsSummary, ["CO1", "CO2"]) || "CO2";


        // Add Summary to Sheet
        XLSX.utils.sheet_add_aoa(ws, [["CO Attainment Summary (PT1)"]], { origin: "A1" });
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["", "CO1", "CO2", "CO3", "CO4", "CO5"]], { origin: "A2" });
        XLSX.utils.sheet_add_aoa(ws, [["Total No. of Students appeared", totalStudentsPresentForPT1]], { origin: "A3" });
        merges.push({ s: { r: 2, c: 1 }, e: { r: 2, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["No. of Students Achieved the Target CO%", achievedCounts.CO1, achievedCounts.CO2, achievedCounts.CO3, achievedCounts.CO4, achievedCounts.CO5]], { origin: "A4" });
        XLSX.utils.sheet_add_aoa(ws, [["Attainment Level", attainmentLevelsSummary.CO1, attainmentLevelsSummary.CO2, attainmentLevelsSummary.CO3, attainmentLevelsSummary.CO4, attainmentLevelsSummary.CO5]], { origin: "A5" });
        XLSX.utils.sheet_add_aoa(ws, [["Total No. of Students who need Remedial Class", remedialCounts.CO1, remedialCounts.CO2, remedialCounts.CO3, remedialCounts.CO4, remedialCounts.CO5]], { origin: "A6" });
        
        currentRow = 7; // Start data after summary and a blank row

        // Add Main Data Headers
        const header1 = ["S.No", "Reg.No", "Name", "MARKS ALLOCATED", null, null, null, null, "MARKS OBTAINED", null, null, null, null, "CO ATTAINMENT %", null, null, null, null, "ATTAINMENT of COs", null, null, null, null, "PT1 Marks"];
        const header2 = [null, null, null, "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", null];
        XLSX.utils.sheet_add_aoa(ws, [header1, header2], { origin: `A${currentRow}` });
        merges.push({ s: { r: currentRow-1, c: 0 }, e: { r: currentRow, c: 0 } }, { s: { r: currentRow-1, c: 1 }, e: { r: currentRow, c: 1 } }, { s: { r: currentRow-1, c: 2 }, e: { r: currentRow, c: 2 } });
        merges.push({ s: { r: currentRow-1, c: 3 }, e: { r: currentRow-1, c: 7 } }, { s: { r: currentRow-1, c: 8 }, e: { r: currentRow-1, c: 12 } });
        merges.push({ s: { r: currentRow-1, c: 13 }, e: { r: currentRow-1, c: 17 } }, { s: { r: currentRow-1, c: 18 }, e: { r: currentRow-1, c: 22 } });
        merges.push({ s: { r: currentRow-1, c: 23 }, e: { r: currentRow, c: 23 } });
        currentRow += 2;

        // Add Main Data
        const test1DataAsAoA = test1Data.map(row => [
            row["S.No"], row["Reg.No"], row["Name"],
            row["MARKS ALLOCATED CO1"], row["MARKS ALLOCATED CO2"], row["MARKS ALLOCATED CO3"], row["MARKS ALLOCATED CO4"], row["MARKS ALLOCATED CO5"],
            row["MARKS OBTAINED CO1"], row["MARKS OBTAINED CO2"], row["MARKS OBTAINED CO3"], row["MARKS OBTAINED CO4"], row["MARKS OBTAINED CO5"],
            row["CO ATTAINMENT % CO1"], row["CO ATTAINMENT % CO2"], row["CO ATTAINMENT % CO3"], row["CO ATTAINMENT % CO4"], row["CO ATTAINMENT % CO5"],
            getIndividualAttainmentLevel(row["CO ATTAINMENT % CO1"]), getIndividualAttainmentLevel(row["CO ATTAINMENT % CO2"]), getIndividualAttainmentLevel(row["CO ATTAINMENT % CO3"]), getIndividualAttainmentLevel(row["CO ATTAINMENT % CO4"]), getIndividualAttainmentLevel(row["CO ATTAINMENT % CO5"]),
            row["PT1"]
        ]);
        XLSX.utils.sheet_add_aoa(ws, test1DataAsAoA, { origin: `A${currentRow}` });
        
        ws["!merges"] = merges;
        ws["!cols"] = [{wch: 8}, {wch: 15}, {wch: 20}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}];
        XLSX.utils.book_append_sheet(wb, ws, "Test 1 Results");
    }

    // --- Process Test 2 ---
    const test2Data = convertTest2Data(uploadedExcelData);
    if (test2Data.length > 0) {
        const ws = {};
        const merges = [];
        let currentRow = 0;
        
        // Calculate Summary for Test 2
        let totalStudentsPresentForPT2 = 0;
        test2Data.forEach(row => { if (String(row["PT2"]).toLowerCase() !== "ab") totalStudentsPresentForPT2++; });

        const achievedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const totalAttendedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const remedialCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };

        test2Data.forEach(row => {
            if (String(row["PT2"]).toLowerCase() !== "ab") {
                ["CO3", "CO4", "CO5"].forEach(co => { // Test 2 COs
                    if (parseFloat(row[`MARKS ALLOCATED ${co}`]) > 0) {
                        totalAttendedCounts[co]++;
                        if (parseFloat(row[`CO ATTAINMENT % ${co}`]) >= targetCOPercent) achievedCounts[co]++;
                        else remedialCounts[co]++;
                    }
                });
            }
        });

        const attainmentLevelsSummary = {};
        for (const co in achievedCounts) {
            if (totalAttendedCounts[co] > 0) {
                const percentage = (achievedCounts[co] / totalAttendedCounts[co]) * 100;
                attainmentLevelsSummary[co] = getSummaryAttainmentLevel(percentage);
            } else {
                attainmentLevelsSummary[co] = "";
            }
        }

        // FIX: Use the specific logic for Test 2 (only compare CO4 and CO5)
        lowestTest2CO = findLowestAttainmentCO(attainmentLevelsSummary, ["CO4", "CO5"]) || "CO4";

        // Add Summary, Headers, and Data to Sheet (similar to Test 1's implementation)
        XLSX.utils.sheet_add_aoa(ws, [["CO Attainment Summary (PT2)"]], { origin: "A1" });
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["", "CO1", "CO2", "CO3", "CO4", "CO5"]], { origin: "A2" });
        XLSX.utils.sheet_add_aoa(ws, [["Total No. of Students appeared", totalStudentsPresentForPT2]], { origin: "A3" });
        merges.push({ s: { r: 2, c: 1 }, e: { r: 2, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["No. of Students Achieved the Target CO%", achievedCounts.CO1, achievedCounts.CO2, achievedCounts.CO3, achievedCounts.CO4, achievedCounts.CO5]], { origin: "A4" });
        XLSX.utils.sheet_add_aoa(ws, [["Attainment Level", attainmentLevelsSummary.CO1, attainmentLevelsSummary.CO2, attainmentLevelsSummary.CO3, attainmentLevelsSummary.CO4, attainmentLevelsSummary.CO5]], { origin: "A5" });
        XLSX.utils.sheet_add_aoa(ws, [["Total No. of Students who need Remedial Class", remedialCounts.CO1, remedialCounts.CO2, remedialCounts.CO3, remedialCounts.CO4, remedialCounts.CO5]], { origin: "A6" });
        
        currentRow = 7;
        const header1 = ["S.No", "Reg.No", "Name", "MARKS ALLOCATED", null, null, null, null, "MARKS OBTAINED", null, null, null, null, "CO ATTAINMENT %", null, null, null, null, "ATTAINMENT of COs", null, null, null, null, "PT2 Marks"];
        const header2 = [null, null, null, "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", null];
        XLSX.utils.sheet_add_aoa(ws, [header1, header2], { origin: `A${currentRow}` });
        merges.push({ s: { r: currentRow-1, c: 0 }, e: { r: currentRow, c: 0 } }, { s: { r: currentRow-1, c: 1 }, e: { r: currentRow, c: 1 } }, { s: { r: currentRow-1, c: 2 }, e: { r: currentRow, c: 2 } });
        merges.push({ s: { r: currentRow-1, c: 3 }, e: { r: currentRow-1, c: 7 } }, { s: { r: currentRow-1, c: 8 }, e: { r: currentRow-1, c: 12 } });
        merges.push({ s: { r: currentRow-1, c: 13 }, e: { r: currentRow-1, c: 17 } }, { s: { r: currentRow-1, c: 18 }, e: { r: currentRow-1, c: 22 } });
        merges.push({ s: { r: currentRow-1, c: 23 }, e: { r: currentRow, c: 23 } });
        currentRow += 2;
        
        const test2DataAsAoA = test2Data.map(row => [
            row["S.No"], row["Reg.No"], row["Name"],
            row["MARKS ALLOCATED CO1"], row["MARKS ALLOCATED CO2"], row["MARKS ALLOCATED CO3"], row["MARKS ALLOCATED CO4"], row["MARKS ALLOCATED CO5"],
            row["MARKS OBTAINED CO1"], row["MARKS OBTAINED CO2"], row["MARKS OBTAINED CO3"], row["MARKS OBTAINED CO4"], row["MARKS OBTAINED CO5"],
            row["CO ATTAINMENT % CO1"], row["CO ATTAINMENT % CO2"], row["CO ATTAINMENT % CO3"], row["CO ATTAINMENT % CO4"], row["CO ATTAINMENT % CO5"],
            getIndividualAttainmentLevel(row["CO ATTAINMENT % CO1"]), getIndividualAttainmentLevel(row["CO ATTAINMENT % CO2"]), getIndividualAttainmentLevel(row["CO ATTAINMENT % CO3"]), getIndividualAttainmentLevel(row["CO ATTAINMENT % CO4"]), getIndividualAttainmentLevel(row["CO ATTAINMENT % CO5"]),
            row["PT2"]
        ]);
        XLSX.utils.sheet_add_aoa(ws, test2DataAsAoA, { origin: `A${currentRow}` });
        
        ws["!merges"] = merges;
        ws["!cols"] = [{wch: 8}, {wch: 15}, {wch: 20}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}];
        XLSX.utils.book_append_sheet(wb, ws, "Test 2 Results");
    }

    // --- Process IP Results ---
    const ipData = convertIPData(uploadedExcelData);
    if (ipData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(ipData);
        ws["!cols"] = [{wch: 8}, {wch: 15}, {wch: 20}, {wch: 10}, {wch: 10}, {wch: 10}];
        XLSX.utils.book_append_sheet(wb, ws, "IP Results");
    }

    // --- Process IP1 CO Attainment ---
    const ip1COAttainmentData = convertIP1COAttainmentData(ipData, lowestTest1CO);
    if (ip1COAttainmentData.length > 0) {
        const ws = {};
        const merges = [];
        let currentRow = 0;
        
        // Calculate Summary
        let totalStudentsPresentForIP1 = 0;
        ip1COAttainmentData.forEach(row => { if (String(row["IP1 Marks"]).toLowerCase() !== 'ab') totalStudentsPresentForIP1++; });

        const achievedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const totalAttendedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const remedialCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        
        ip1COAttainmentData.forEach(row => {
            if(String(row["IP1 Marks"]).toLowerCase() !== 'ab') {
                const marksAllocated = parseFloat(row[`MARKS ALLOCATED ${lowestTest1CO}`]);
                if (marksAllocated > 0) {
                    totalAttendedCounts[lowestTest1CO]++;
                    const attainmentPercent = parseFloat(row[`CO ATTAINMENT % ${lowestTest1CO}`]);
                    if (attainmentPercent >= targetCOPercent) achievedCounts[lowestTest1CO]++;
                    else remedialCounts[lowestTest1CO]++;
                }
            }
        });

        const attainmentLevels = { CO1: "", CO2: "", CO3: "", CO4: "", CO5: "" };
        if (totalAttendedCounts[lowestTest1CO] > 0) {
            attainmentLevels[lowestTest1CO] = calculateAttainmentLevelForIP(achievedCounts[lowestTest1CO], totalAttendedCounts[lowestTest1CO]);
        }
        
        // Add Summary, headers, and data
        XLSX.utils.sheet_add_aoa(ws, [["CO Attainment Summary (IP1)"]], { origin: "A1" });
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["", "CO1", "CO2", "CO3", "CO4", "CO5"]], { origin: "A2" });
        XLSX.utils.sheet_add_aoa(ws, [[`*IP1 Marks mapped to ${lowestTest1CO}`]], { origin: "A3" });
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["Total No. of Students appeared", totalStudentsPresentForIP1]], { origin: "A4" });
        merges.push({ s: { r: 3, c: 1 }, e: { r: 3, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["No. of Students Achieved the Target CO%", achievedCounts.CO1, achievedCounts.CO2, achievedCounts.CO3, achievedCounts.CO4, achievedCounts.CO5]], { origin: "A5" });
        XLSX.utils.sheet_add_aoa(ws, [["Attainment Level", attainmentLevels.CO1, attainmentLevels.CO2, attainmentLevels.CO3, attainmentLevels.CO4, attainmentLevels.CO5]], { origin: "A6" });
        XLSX.utils.sheet_add_aoa(ws, [["Total No. of Students who need Remedial Class", remedialCounts.CO1, remedialCounts.CO2, remedialCounts.CO3, remedialCounts.CO4, remedialCounts.CO5]], { origin: "A7" });
        
        currentRow = 9;
        const header1 = ["S.No", "Reg.No", "MARKS ALLOCATED", null, null, null, null, "MARKS OBTAINED", null, null, null, null, "CO ATTAINMENT %", null, null, null, null, "ATTAINMENT of COs", null, null, null, null, "IP1 Marks"];
        const header2 = [null, null, "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", null];
        XLSX.utils.sheet_add_aoa(ws, [header1, header2], { origin: `A${currentRow}` });
        merges.push({ s: { r: currentRow-1, c: 0 }, e: { r: currentRow, c: 0 } }, { s: { r: currentRow-1, c: 1 }, e: { r: currentRow, c: 1 } });
        merges.push({ s: { r: currentRow-1, c: 2 }, e: { r: currentRow-1, c: 6 } }, { s: { r: currentRow-1, c: 7 }, e: { r: currentRow-1, c: 11 } });
        merges.push({ s: { r: currentRow-1, c: 12 }, e: { r: currentRow-1, c: 16 } }, { s: { r: currentRow-1, c: 17 }, e: { r: currentRow-1, c: 21 } });
        merges.push({ s: { r: currentRow-1, c: 22 }, e: { r: currentRow, c: 22 } });
        currentRow += 2;

        const ip1DataAsAoA = ip1COAttainmentData.map(row => [
            row["S.No"], row["Reg.No"],
            row["MARKS ALLOCATED CO1"], row["MARKS ALLOCATED CO2"], row["MARKS ALLOCATED CO3"], row["MARKS ALLOCATED CO4"], row["MARKS ALLOCATED CO5"],
            row["MARKS OBTAINED CO1"], row["MARKS OBTAINED CO2"], row["MARKS OBTAINED CO3"], row["MARKS OBTAINED CO4"], row["MARKS OBTAINED CO5"],
            row["CO ATTAINMENT % CO1"], row["CO ATTAINMENT % CO2"], row["CO ATTAINMENT % CO3"], row["CO ATTAINMENT % CO4"], row["CO ATTAINMENT % CO5"],
            calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO1"]), calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO2"]), calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO3"]), calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO4"]), calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO5"]),
            row["IP1 Marks"]
        ]);

        XLSX.utils.sheet_add_aoa(ws, ip1DataAsAoA, { origin: `A${currentRow}` });
        ws["!merges"] = merges;
        ws["!cols"] = [{wch: 8}, {wch: 15}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}];
        XLSX.utils.book_append_sheet(wb, ws, "IP1 CO Attainment");
    }

    // --- Process IP2 CO Attainment ---
    const ip2COAttainmentData = convertIP2COAttainmentData(ipData, lowestTest2CO);
    if (ip2COAttainmentData.length > 0) {
        // Similar logic for IP2
        const ws = {};
        const merges = [];
        let currentRow = 0;

        let totalStudentsPresentForIP2 = 0;
        ip2COAttainmentData.forEach(row => { if (String(row["IP2 Marks"]).toLowerCase() !== 'ab') totalStudentsPresentForIP2++; });

        const achievedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const totalAttendedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const remedialCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        
        ip2COAttainmentData.forEach(row => {
            if(String(row["IP2 Marks"]).toLowerCase() !== 'ab') {
                const marksAllocated = parseFloat(row[`MARKS ALLOCATED ${lowestTest2CO}`]);
                if (marksAllocated > 0) {
                    totalAttendedCounts[lowestTest2CO]++;
                    const attainmentPercent = parseFloat(row[`CO ATTAINMENT % ${lowestTest2CO}`]);
                    if (attainmentPercent >= targetCOPercent) achievedCounts[lowestTest2CO]++;
                    else remedialCounts[lowestTest2CO]++;
                }
            }
        });

        const attainmentLevels = { CO1: "", CO2: "", CO3: "", CO4: "", CO5: "" };
        if (totalAttendedCounts[lowestTest2CO] > 0) {
            attainmentLevels[lowestTest2CO] = calculateAttainmentLevelForIP(achievedCounts[lowestTest2CO], totalAttendedCounts[lowestTest2CO]);
        }

        XLSX.utils.sheet_add_aoa(ws, [["CO Attainment Summary (IP2)"]], { origin: "A1" });
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["", "CO1", "CO2", "CO3", "CO4", "CO5"]], { origin: "A2" });
        XLSX.utils.sheet_add_aoa(ws, [[`*IP2 Marks mapped to ${lowestTest2CO}`]], { origin: "A3" });
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["Total No. of Students appeared", totalStudentsPresentForIP2]], { origin: "A4" });
        merges.push({ s: { r: 3, c: 1 }, e: { r: 3, c: 5 } });
        XLSX.utils.sheet_add_aoa(ws, [["No. of Students Achieved the Target CO%", achievedCounts.CO1, achievedCounts.CO2, achievedCounts.CO3, achievedCounts.CO4, achievedCounts.CO5]], { origin: "A5" });
        XLSX.utils.sheet_add_aoa(ws, [["Attainment Level", attainmentLevels.CO1, attainmentLevels.CO2, attainmentLevels.CO3, attainmentLevels.CO4, attainmentLevels.CO5]], { origin: "A6" });
        XLSX.utils.sheet_add_aoa(ws, [["Total No. of Students who need Remedial Class", remedialCounts.CO1, remedialCounts.CO2, remedialCounts.CO3, remedialCounts.CO4, remedialCounts.CO5]], { origin: "A7" });
        
        currentRow = 9;
        const header1 = ["S.No", "Reg.No", "MARKS ALLOCATED", null, null, null, null, "MARKS OBTAINED", null, null, null, null, "CO ATTAINMENT %", null, null, null, null, "ATTAINMENT of COs", null, null, null, null, "IP2 Marks"];
        const header2 = [null, null, "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", null];
        XLSX.utils.sheet_add_aoa(ws, [header1, header2], { origin: `A${currentRow}` });
        merges.push({ s: { r: currentRow-1, c: 0 }, e: { r: currentRow, c: 0 } }, { s: { r: currentRow-1, c: 1 }, e: { r: currentRow, c: 1 } });
        merges.push({ s: { r: currentRow-1, c: 2 }, e: { r: currentRow-1, c: 6 } }, { s: { r: currentRow-1, c: 7 }, e: { r: currentRow-1, c: 11 } });
        merges.push({ s: { r: currentRow-1, c: 12 }, e: { r: currentRow-1, c: 16 } }, { s: { r: currentRow-1, c: 17 }, e: { r: currentRow-1, c: 21 } });
        merges.push({ s: { r: currentRow-1, c: 22 }, e: { r: currentRow, c: 22 } });
        currentRow += 2;

        const ip2DataAsAoA = ip2COAttainmentData.map(row => [
            row["S.No"], row["Reg.No"],
            row["MARKS ALLOCATED CO1"], row["MARKS ALLOCATED CO2"], row["MARKS ALLOCATED CO3"], row["MARKS ALLOCATED CO4"], row["MARKS ALLOCATED CO5"],
            row["MARKS OBTAINED CO1"], row["MARKS OBTAINED CO2"], row["MARKS OBTAINED CO3"], row["MARKS OBTAINED CO4"], row["MARKS OBTAINED CO5"],
            row["CO ATTAINMENT % CO1"], row["CO ATTAINMENT % CO2"], row["CO ATTAINMENT % CO3"], row["CO ATTAINMENT % CO4"], row["CO ATTAINMENT % CO5"],
            calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO1"]), calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO2"]), calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO3"]), calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO4"]), calculateAttainmentLevelForIP(row["CO ATTAINMENT % CO5"]),
            row["IP2 Marks"]
        ]);

        XLSX.utils.sheet_add_aoa(ws, ip2DataAsAoA, { origin: `A${currentRow}` });
        ws["!merges"] = merges;
        ws["!cols"] = [{wch: 8}, {wch: 15}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}];
        XLSX.utils.book_append_sheet(wb, ws, "IP2 CO Attainment");
    }

    // --- Finalize and Download ---
    XLSX.writeFile(wb, "All_Theorylab_Data_With_Summaries.xlsx");
  };


 return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Upload Theory + Lab File</h2>

      <input
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div className="w-60 mb-4">
        <Button
          label="Upload File"
          onClick={handleUploadClick}
          others="bg-green-500 hover:bg-green-700"
        />
      </div>

      {displayExcelData.length > 0 && (
        <>
          <div className="mt-4 flex space-x-4">
            <Button
              label="Test 1 (Lab)"
              onClick={handleTest1Click}
              others="bg-blue-500 hover:bg-blue-700"
            />
            <Button
              label="Test 2 (Lab)"
              onClick={handleTest2Click}
              others="bg-blue-500 hover:bg-blue-700"
            />
            <Button
              label="IP (Lab)"
              onClick={handleIPClick}
              others="bg-blue-500 hover:bg-blue-700"
            />
            <Button
              label="Download All Data"
              onClick={handleDownloadAllData}
              others="bg-purple-500 hover:bg-purple-700"
            />
          </div>
          <BasicsTable sno={false} header={displayHeaders} data={displayExcelData} fields={displayHeaders} />
        </>
      )}
    </div>
  );
}

export default Theorylab;