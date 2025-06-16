import React, { useEffect, useState } from "react";
import CustomButton from "../../../compounds/button"; // Assuming CustomButton is in this path
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // Import XLSX for Excel export

// Helper function to identify students needing remedial classes (adapted for IP2)
const identifyRemedialStudentsList = (data, targetCOPercent, filterCO = "All") => {
    if (!data) return [];
    const remedialList = [];
    const target = parseFloat(targetCOPercent);

    data.forEach(student => {
        const ip2Mark = String(student["IP2 Marks"]).toLowerCase();
        const isPresent = ip2Mark !== "" && ip2Mark !== "ab" && ip2Mark !== "absent";
        const studentRemedialCOs = [];

        if (isPresent) {
            const cos = ["CO1", "CO2", "CO3", "CO4", "CO5"];

            cos.forEach(co => {
                const marksAllocatedKey = `MARKS ALLOCATED ${co}`;
                const attainmentPercentKey = `CO ATTAINMENT % ${co}`;
                const marksObtainedKey = `MARKS OBTAINED ${co}`;

                const marksAllocated = parseFloat(student[marksAllocatedKey]);
                const attainmentPercentValue = student[attainmentPercentKey];
                const attainmentPercent = attainmentPercentValue === "" || attainmentPercentValue === null || attainmentPercentValue === undefined ? NaN : parseFloat(attainmentPercentValue);

                if (!isNaN(marksAllocated) && marksAllocated > 0) {
                    if (!isNaN(attainmentPercent) && attainmentPercent < target) {
                        if (filterCO === "All" || filterCO === co) {
                            studentRemedialCOs.push({
                                coName: co,
                                attainment: student[attainmentPercentKey],
                                marksAllocated: student[marksAllocatedKey],
                                marksObtained: student[marksObtainedKey]
                            });
                        }
                    } else if (isNaN(attainmentPercent) && marksAllocated > 0) {
                        if (filterCO === "All" || filterCO === co) {
                            studentRemedialCOs.push({
                                coName: co,
                                attainment: "N/A",
                                marksAllocated: student[marksAllocatedKey],
                                marksObtained: student[marksObtainedKey]
                            });
                        }
                    }
                }
            });
        }
        if (studentRemedialCOs.length > 0) {
            remedialList.push({
                ...student, // Add the full student object
                remedialCOsDetails: studentRemedialCOs
            });
        }
    });
    return remedialList;
};

function IP2COAttainmentResults({ onSendToBackend }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { convertedData, lowestTest2AttainmentCO: initialLowestTest2AttainmentCO } = location.state || {};

  const [summaryData, setSummaryData] = useState(null);
  const [showRemedialView, setShowRemedialView] = useState(false);
  const [remedialStudentList, setRemedialStudentList] = useState([]);
  const [selectedRemedialCO, setSelectedRemedialCO] = useState("All");
  const [dynamicIP2CO, setDynamicIP2CO] = useState(initialLowestTest2AttainmentCO || "CO4");

  const targetCOPercent = 60;

  const calculateAttainmentLevel = (achieved, total) => {
    const numericAchieved = parseFloat(achieved);
    if (isNaN(numericAchieved)) return "";

    if (typeof total !== 'undefined' && total !== null && total !== "") {
        const numericTotal = parseFloat(total);
        if (isNaN(numericTotal) || numericTotal === 0) return "";
        const percentage = (numericAchieved / numericTotal) * 100;
        return getAttainmentLevelFromPercentage(percentage);
    } else {
        return getAttainmentLevelFromPercentage(numericAchieved);
    }
  };

  const getAttainmentLevelFromPercentage = (percentage) => {
    if (percentage >= 70) return "3";
    if (percentage >= 60) return "2";
    if (percentage >= 50) return "1";
    return "0";
  };

  const formatPercentageForDisplay = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    if (num % 1 === 0) {
      return Math.round(num).toString();
    }
    return num.toString();
  };

  useEffect(() => {
    if (initialLowestTest2AttainmentCO) {
        setDynamicIP2CO(initialLowestTest2AttainmentCO);
    } else {
        const storedDynamicCO = localStorage.getItem('lowestTest2AttainmentCO');
        setDynamicIP2CO(storedDynamicCO || "CO4");
    }

    if (convertedData && convertedData.length > 0) {
      calculateSummary(convertedData, initialLowestTest2AttainmentCO || localStorage.getItem('lowestTest2AttainmentCO') || "CO4");
    }
  }, [convertedData, initialLowestTest2AttainmentCO]);

  useEffect(() => {
    if (showRemedialView && convertedData && convertedData.length > 0) {
        const students = identifyRemedialStudentsList(convertedData, targetCOPercent, selectedRemedialCO);
        setRemedialStudentList(students);
    } else if (!showRemedialView) {
        setRemedialStudentList([]);
    }
  }, [showRemedialView, convertedData, selectedRemedialCO, targetCOPercent]);

  const calculateSummary = (data, currentDynamicIP2CO) => {
    let totalStudentsPresentForIP2 = 0;
    data.forEach((row) => {
      const ip2Mark = String(row["IP2 Marks"]).toLowerCase();
      if (ip2Mark !== "" && ip2Mark !== "ab" && ip2Mark !== "absent") {
        totalStudentsPresentForIP2++;
      }
    });

    const achievedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
    const totalAttendedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
    const remedialCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };

    data.forEach((row) => {
        const ip2Mark = String(row["IP2 Marks"]).toLowerCase();
        const isPresent = ip2Mark !== "" && ip2Mark !== "ab" && ip2Mark !== "absent";

        if (isPresent) {
            ["CO1", "CO2", "CO3", "CO4", "CO5"].forEach(co => {
                const marksAllocatedKey = `MARKS ALLOCATED ${co}`;
                const attainmentPercentKey = `CO ATTAINMENT % ${co}`;
                const marksAllocatedValue = row[marksAllocatedKey];
                const marksAllocated = marksAllocatedValue === "" || marksAllocatedValue === null || marksAllocatedValue === undefined ? 0 : parseFloat(marksAllocatedValue);


                if (marksAllocated > 0) {
                    totalAttendedCounts[co]++;
                    const attainmentPercentValue = row[attainmentPercentKey];
                    const attainmentPercent = attainmentPercentValue === "" || attainmentPercentValue === null || attainmentPercentValue === undefined ? NaN : parseFloat(attainmentPercentValue);

                    if (!isNaN(attainmentPercent)) {
                        if (attainmentPercent >= targetCOPercent) {
                            achievedCounts[co]++;
                        } else {
                            remedialCounts[co]++;
                        }
                    } else {
                        remedialCounts[co]++;
                    }
                }
            });
        }
    });

    const attainmentLevels = { CO1: "", CO2: "", CO3: "", CO4: "", CO5: "" };
    ["CO1", "CO2", "CO3", "CO4", "CO5"].forEach(co => {
        if (totalAttendedCounts[co] > 0) {
            attainmentLevels[co] = calculateAttainmentLevel(
                achievedCounts[co],
                totalAttendedCounts[co]
            );
        }
    });

    setSummaryData({
      targetCOPercent,
      totalStudentsPresentForIP2,
      achievedCounts,
      totalAttendedCounts,
      remedialCounts,
      attainmentLevels,
      overallAttainmentLevel: attainmentLevels[currentDynamicIP2CO] || "",
      dynamicIP2CO: currentDynamicIP2CO,
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleExportExcel = () => {
    if (!convertedData || convertedData.length === 0) {
      alert("No data to export.");
      return;
    }
    if (!summaryData) {
      alert("Summary data not yet calculated. Please wait or refresh.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = {};
    const merges = [];
    let currentRow = 0;

    XLSX.utils.sheet_add_aoa(ws, [["CO Attainment Summary (IP2)"]], { origin: `A${currentRow + 1}` });
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 5 } });
    currentRow++;

    XLSX.utils.sheet_add_aoa(ws, [["", "CO1", "CO2", "CO3", "CO4", "CO5"]], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row2Data = [ "Total No. of Students appeared", summaryData.totalStudentsPresentForIP2, "", "", "", "", ];
    XLSX.utils.sheet_add_aoa(ws, [row2Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row3Data = [ "No. of Students Achieved the Target CO%", summaryData.achievedCounts.CO1, summaryData.achievedCounts.CO2, summaryData.achievedCounts.CO3, summaryData.achievedCounts.CO4, summaryData.achievedCounts.CO5, ];
    XLSX.utils.sheet_add_aoa(ws, [row3Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row4Data = [ "Attainment Level", summaryData.attainmentLevels.CO1, summaryData.attainmentLevels.CO2, summaryData.attainmentLevels.CO3, summaryData.attainmentLevels.CO4, summaryData.attainmentLevels.CO5, ];
    XLSX.utils.sheet_add_aoa(ws, [row4Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row5Data = [ "Total No. of Students who need Remedial Class", summaryData.remedialCounts.CO1, summaryData.remedialCounts.CO2, summaryData.remedialCounts.CO3, summaryData.remedialCounts.CO4, summaryData.remedialCounts.CO5, ];
    XLSX.utils.sheet_add_aoa(ws, [row5Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: `A${currentRow + 1}` });
    currentRow++;

    const mainHeaderStartRow = currentRow;
    const mainDataHeaderRow1 = ["S.No", "Reg.No", "MARKS ALLOCATED", null, null, null, null, "MARKS OBTAINED", null, null, null, null, "CO ATTAINMENT %", null, null, null, null, "ATTAINMENT of COs", null, null, null, null, "IP2 Marks"];
    const mainDataHeaderRow2 = [null, null, "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", null];
    XLSX.utils.sheet_add_aoa(ws, [mainDataHeaderRow1, mainDataHeaderRow2], { origin: `A${currentRow + 1}` });
    currentRow += 2;

    const ip2DataAsAoA = convertedData.map(row => [
      row["S.No"], row["Reg.No"],
      row["MARKS ALLOCATED CO1"] === 0 || row["MARKS ALLOCATED CO1"] === "" || row["MARKS ALLOCATED CO1"] === undefined ? "" : row["MARKS ALLOCATED CO1"],
      row["MARKS ALLOCATED CO2"] === 0 || row["MARKS ALLOCATED CO2"] === "" || row["MARKS ALLOCATED CO2"] === undefined ? "" : row["MARKS ALLOCATED CO2"],
      row["MARKS ALLOCATED CO3"] === 0 || row["MARKS ALLOCATED CO3"] === "" || row["MARKS ALLOCATED CO3"] === undefined ? "" : row["MARKS ALLOCATED CO3"],
      row["MARKS ALLOCATED CO4"] === 0 || row["MARKS ALLOCATED CO4"] === "" || row["MARKS ALLOCATED CO4"] === undefined ? "" : row["MARKS ALLOCATED CO4"],
      row["MARKS ALLOCATED CO5"] === 0 || row["MARKS ALLOCATED CO5"] === "" || row["MARKS ALLOCATED CO5"] === undefined ? "" : row["MARKS ALLOCATED CO5"],
      row["MARKS OBTAINED CO1"] === 0 || row["MARKS OBTAINED CO1"] === "" || row["MARKS OBTAINED CO1"] === undefined ? "" : row["MARKS OBTAINED CO1"],
      row["MARKS OBTAINED CO2"] === 0 || row["MARKS OBTAINED CO2"] === "" || row["MARKS OBTAINED CO2"] === undefined ? "" : row["MARKS OBTAINED CO2"],
      row["MARKS OBTAINED CO3"] === 0 || row["MARKS OBTAINED CO3"] === "" || row["MARKS OBTAINED CO3"] === undefined ? "" : row["MARKS OBTAINED CO3"],
      row["MARKS OBTAINED CO4"] === 0 || row["MARKS OBTAINED CO4"] === "" || row["MARKS OBTAINED CO4"] === undefined ? "" : row["MARKS OBTAINED CO4"],
      row["MARKS OBTAINED CO5"] === 0 || row["MARKS OBTAINED CO5"] === "" || row["MARKS OBTAINED CO5"] === undefined ? "" : row["MARKS OBTAINED CO5"],
      formatPercentageForDisplay(row["CO ATTAINMENT % CO1"]), formatPercentageForDisplay(row["CO ATTAINMENT % CO2"]), formatPercentageForDisplay(row["CO ATTAINMENT % CO3"]), formatPercentageForDisplay(row["CO ATTAINMENT % CO4"]), formatPercentageForDisplay(row["CO ATTAINMENT % CO5"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO1"]), calculateAttainmentLevel(row["CO ATTAINMENT % CO2"]), calculateAttainmentLevel(row["CO ATTAINMENT % CO3"]), calculateAttainmentLevel(row["CO ATTAINMENT % CO4"]), calculateAttainmentLevel(row["CO ATTAINMENT % CO5"]),
      row["IP2 Marks"]
    ]);
    XLSX.utils.sheet_add_aoa(ws, ip2DataAsAoA, { origin: `A${currentRow + 1}` });

    merges.push({ s: { r: mainHeaderStartRow, c: 0 }, e: { r: mainHeaderStartRow + 1, c: 0 } }, { s: { r: mainHeaderStartRow, c: 1 }, e: { r: mainHeaderStartRow + 1, c: 1 } }, { s: { r: mainHeaderStartRow, c: 2 }, e: { r: mainHeaderStartRow, c: 6 } }, { s: { r: mainHeaderStartRow, c: 7 }, e: { r: mainHeaderStartRow, c: 11 } }, { s: { r: mainHeaderStartRow, c: 12 }, e: { r: mainHeaderStartRow, c: 16 } }, { s: { r: mainHeaderStartRow, c: 17 }, e: { r: mainHeaderStartRow, c: 21 } }, { s: { r: mainHeaderStartRow, c: 22 }, e: { r: mainHeaderStartRow + 1, c: 22 } });
    ws["!merges"] = merges;
    ws["!cols"] = [{ wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, "IP2_CO_Attainment_Results");
    XLSX.writeFile(wb, "IP2_CO_Attainment_Results_with_Summary.xlsx");
  };

  const handleViewRemedial = () => {
    if (convertedData && convertedData.length > 0) {
      setSelectedRemedialCO("All");
      setShowRemedialView(prev => !prev);
    } else {
      alert("No data available to identify remedial students.");
    }
  };

  const handleExportRemedialExcel = () => {
    if (!remedialStudentList || remedialStudentList.length === 0) {
      alert(`No remedial student data for ${selectedRemedialCO === "All" ? "any CO" : selectedRemedialCO} to export.`);
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = {};
    const merges = [];
    let currentRow = 0;

    XLSX.utils.sheet_add_aoa(ws, [["Remedial Students List (IP2)"]], { origin: `A${currentRow + 1}` });
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 22 } });
    currentRow++;

    if (selectedRemedialCO !== "All") {
        XLSX.utils.sheet_add_aoa(ws, [[`Filtered by CO: ${selectedRemedialCO}`]], { origin: `A${currentRow + 1}` });
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 22 } });
        currentRow++;
    }
    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: `A${currentRow + 1}` });
    currentRow++;

    const mainHeaderStartRow = currentRow;
    const mainDataHeaderRow1 = ["S.No", "Reg.No", "MARKS ALLOCATED", null, null, null, null, "MARKS OBTAINED", null, null, null, null, "CO ATTAINMENT %", null, null, null, null, "ATTAINMENT of COs", null, null, null, null, "IP2 Marks"];
    const mainDataHeaderRow2 = [null, null, "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", null];
    XLSX.utils.sheet_add_aoa(ws, [mainDataHeaderRow1, mainDataHeaderRow2], { origin: `A${currentRow + 1}` });
    currentRow += 2;

    const remedialDataAsAoA = remedialStudentList.map((row, index) => [
      index + 1, row["Reg.No"],
      row["MARKS ALLOCATED CO1"] === 0 || row["MARKS ALLOCATED CO1"] === "" || row["MARKS ALLOCATED CO1"] === undefined ? "" : row["MARKS ALLOCATED CO1"],
      row["MARKS ALLOCATED CO2"] === 0 || row["MARKS ALLOCATED CO2"] === "" || row["MARKS ALLOCATED CO2"] === undefined ? "" : row["MARKS ALLOCATED CO2"],
      row["MARKS ALLOCATED CO3"] === 0 || row["MARKS ALLOCATED CO3"] === "" || row["MARKS ALLOCATED CO3"] === undefined ? "" : row["MARKS ALLOCATED CO3"],
      row["MARKS ALLOCATED CO4"] === 0 || row["MARKS ALLOCATED CO4"] === "" || row["MARKS ALLOCATED CO4"] === undefined ? "" : row["MARKS ALLOCATED CO4"],
      row["MARKS ALLOCATED CO5"] === 0 || row["MARKS ALLOCATED CO5"] === "" || row["MARKS ALLOCATED CO5"] === undefined ? "" : row["MARKS ALLOCATED CO5"],
      row["MARKS OBTAINED CO1"] === 0 || row["MARKS OBTAINED CO1"] === "" || row["MARKS OBTAINED CO1"] === undefined ? "" : row["MARKS OBTAINED CO1"],
      row["MARKS OBTAINED CO2"] === 0 || row["MARKS OBTAINED CO2"] === "" || row["MARKS OBTAINED CO2"] === undefined ? "" : row["MARKS OBTAINED CO2"],
      row["MARKS OBTAINED CO3"] === 0 || row["MARKS OBTAINED CO3"] === "" || row["MARKS OBTAINED CO3"] === undefined ? "" : row["MARKS OBTAINED CO3"],
      row["MARKS OBTAINED CO4"] === 0 || row["MARKS OBTAINED CO4"] === "" || row["MARKS OBTAINED CO4"] === undefined ? "" : row["MARKS OBTAINED CO4"],
      row["MARKS OBTAINED CO5"] === 0 || row["MARKS OBTAINED CO5"] === "" || row["MARKS OBTAINED CO5"] === undefined ? "" : row["MARKS OBTAINED CO5"],
      formatPercentageForDisplay(row["CO ATTAINMENT % CO1"]), formatPercentageForDisplay(row["CO ATTAINMENT % CO2"]), formatPercentageForDisplay(row["CO ATTAINMENT % CO3"]), formatPercentageForDisplay(row["CO ATTAINMENT % CO4"]), formatPercentageForDisplay(row["CO ATTAINMENT % CO5"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO1"]), calculateAttainmentLevel(row["CO ATTAINMENT % CO2"]), calculateAttainmentLevel(row["CO ATTAINMENT % CO3"]), calculateAttainmentLevel(row["CO ATTAINMENT % CO4"]), calculateAttainmentLevel(row["CO ATTAINMENT % CO5"]),
      row["IP2 Marks"]
    ]);
    XLSX.utils.sheet_add_aoa(ws, remedialDataAsAoA, { origin: `A${currentRow + 1}` });

    merges.push({ s: { r: mainHeaderStartRow, c: 0 }, e: { r: mainHeaderStartRow + 1, c: 0 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 1 }, e: { r: mainHeaderStartRow + 1, c: 1 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 2 }, e: { r: mainHeaderStartRow, c: 6 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 7 }, e: { r: mainHeaderStartRow, c: 11 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 12 }, e: { r: mainHeaderStartRow, c: 16 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 17 }, e: { r: mainHeaderStartRow, c: 21 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 22 }, e: { r: mainHeaderStartRow + 1, c: 22 } });

    ws["!merges"] = merges;
    ws["!cols"] = [ { wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, ];

    XLSX.utils.book_append_sheet(wb, ws, `Remedial_IP2_${selectedRemedialCO}`);
    XLSX.writeFile(wb, `IP2_Remedial_Students_List_${selectedRemedialCO}.xlsx`);
  };

  const dataToDisplay = showRemedialView ? remedialStudentList : convertedData;

  // Initial check for no data to render a minimal page
  if (!convertedData || convertedData.length === 0) {
    return (
      <div className="p-6">
        <div className="mt-4 flex space-x-4 justify-center">
             <CustomButton label="Back" onClick={handleBack} others="bg-gray-500 hover:bg-gray-700" />
        </div>
        <div className="mt-6 text-center text-red-500">
            No IP2 data available. Please ensure IP2 data is processed correctly.
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">IP2 CO Attainment Results</h2>

      <div className="mt-4 flex space-x-4 justify-center">
        <CustomButton label="Back" onClick={handleBack} others="bg-gray-500 hover:bg-gray-700" />
        <CustomButton label="Export as Excel" onClick={handleExportExcel} others="bg-blue-500 hover:bg-blue-700" />
        <CustomButton label="Send to Backend" onClick={() => onSendToBackend(convertedData, "uploadIP2COAttainment")} others="bg-green-500 hover:bg-green-700" />

        <CustomButton
            label={showRemedialView ? "View All Students" : "View Remedial Students"}
            onClick={handleViewRemedial}
            others="bg-purple-500 hover:bg-purple-700"
        />
        {showRemedialView && (
          <>
            <CustomButton
                label="Export Remedial Students"
                onClick={handleExportRemedialExcel}
                others="bg-orange-500 hover:bg-orange-700"
            />
             <select
                className="p-2 border rounded shadow"
                value={selectedRemedialCO}
                onChange={(e) => setSelectedRemedialCO(e.target.value)}
            >
              <option value="All">All COs</option>
              <option value="CO1">CO1</option><option value="CO2">CO2</option>
              <option value="CO3">CO3</option><option value="CO4">CO4</option>
              <option value="CO5">CO5</option>
            </select>
          </>
        )}
      </div>

      {!showRemedialView && summaryData && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-800">CO Attainment Summary (IP2)</h3>
          {summaryData.dynamicIP2CO && (
            <p className="mb-4 text-sm text-gray-600">
              *IP2 Marks are mapped to **{summaryData.dynamicIP2CO}** based on the lowest attainment level from Test 2.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r"></th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">CO1</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">CO2</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">CO3</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">CO4</th>
                  <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CO5</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Total No. of Students appeared</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.totalStudentsPresentForIP2}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r"></td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r"></td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r"></td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700"></td>
                </tr>
                <tr>
                  <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900 border-r">No. of Students Achieved the Target CO%</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO1}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO2}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO3}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO4}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO5}</td>
                </tr>
                <tr>
                  <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Attainment Level</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO1}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO2}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO3}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO4}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO5}</td>
                </tr>
                <tr>
                  <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Total No. of Students who need Remedial Class</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO1}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO2}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO3}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO4}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO5}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* ====== START: MODIFIED SECTION ====== */}
        <div className="mt-6 overflow-x-auto">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 text-center">
                {showRemedialView
                    ? `Remedial Student List (${selectedRemedialCO === "All" ? "All COs" : selectedRemedialCO})`
                    : "All Students Data (IP2)"}
            </h3>
            <table className="min-w-full divide-y divide-gray-200 shadow-md sm:rounded-lg">
                <thead className="bg-gray-50">
                <tr>
                    <th rowSpan="2" className="px-2 py-1 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">S.No</th>
                    <th rowSpan="2" className="px-2 py-1 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">Reg.No</th>
                    <th colSpan="5" className="px-2 py-1 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">MARKS ALLOCATED</th>
                    <th colSpan="5" className="px-2 py-1 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">MARKS OBTAINED</th>
                    <th colSpan="5" className="px-2 py-1 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">CO ATTAINMENT %</th>
                    <th colSpan="5" className="px-2 py-1 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">ATTAINMENT of COs</th>
                    <th rowSpan="2" className="px-2 py-1 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2">IP2 Marks</th>
                </tr>
                <tr>
                    {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (<th key={`allocated-${co}`} scope="col" className="px-2 py-1 text-center text-xs font-medium text-black-100 uppercase tracking-wider border-r">{co}</th>))}
                    {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (<th key={`obtained-${co}`} scope="col" className="px-2 py-1 text-center text-xs font-medium text-black-100 uppercase tracking-wider border-r">{co}</th>))}
                    {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (<th key={`attainment-percent-${co}`} scope="col" className="px-2 py-1 text-center text-xs font-medium text-black-100 uppercase tracking-wider border-r">{co}</th>))}
                    {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (<th key={`attainment-level-${co}`} scope="col" className="px-2 py-1 text-center text-xs font-medium text-black-100 uppercase tracking-wider border-r">{co}</th>))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {dataToDisplay.length > 0 ? (
                    dataToDisplay.map((row, index) => (
                    <tr key={index}>
                        <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900 border-r">
                        {showRemedialView ? index + 1 : row["S.No"]}
                        </td>
                        <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900 border-r">{row["Reg.No"]}</td>
                        {[1,2,3,4,5].map(coNum => <td key={`alloc-${coNum}`} className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{row[`MARKS ALLOCATED CO${coNum}`] === 0 || row[`MARKS ALLOCATED CO${coNum}`] === "" || row[`MARKS ALLOCATED CO${coNum}`] === undefined || row[`MARKS ALLOCATED CO${coNum}`] === null ? "" : row[`MARKS ALLOCATED CO${coNum}`]}</td>)}
                        {[1,2,3,4,5].map(coNum => <td key={`obt-${coNum}`} className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{row[`MARKS OBTAINED CO${coNum}`] === 0 || row[`MARKS OBTAINED CO${coNum}`] === "" || row[`MARKS OBTAINED CO${coNum}`] === undefined || row[`MARKS OBTAINED CO${coNum}`] === null ? "" : row[`MARKS OBTAINED CO${coNum}`]}</td>)}
                        {[1,2,3,4,5].map(coNum => <td key={`attP-${coNum}`} className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{formatPercentageForDisplay(row[`CO ATTAINMENT % CO${coNum}`])}</td>)}
                        {[1,2,3,4,5].map(coNum => <td key={`attL-${coNum}`} className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{calculateAttainmentLevel(row[`CO ATTAINMENT % CO${coNum}`])}</td>)}
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{row["IP2 Marks"]}</td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        {/* <td colSpan="23" className="text-center text-gray-600 py-4">
                            No students need remedial classes for {selectedRemedialCO === "All" ? "any CO" : selectedRemedialCO}.
                        </td> */}
                    </tr>
                )}
                </tbody>
            </table>
        </div>
        {/* ====== END: MODIFIED SECTION ====== */}
    </div>
  );
}

export default IP2COAttainmentResults;