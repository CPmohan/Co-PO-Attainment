import React, { useEffect, useState } from "react";
import CustomButton from "../../../compounds/button";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // Import XLSX for Excel export

// Helper function to identify students needing remedial classes (adapted for IP1)
const identifyRemedialStudentsList = (data, targetCOPercent, dynamicIP1CO, filterCO = "All") => {
    if (!data) return [];
    const remedialList = [];
    const target = parseFloat(targetCOPercent);

    data.forEach(student => {
        // Check for IP1 Marks to determine if the student was present
        const ip1Mark = String(student["IP1 Marks"]).toLowerCase();
        const isPresent = ip1Mark !== "" && ip1Mark !== "ab" && ip1Mark !== "absent";
        let needsRemedialForAtLeastOneCO = false;
        const studentRemedialCOs = []; // Store COs for which this student needs remedial

        if (isPresent) {
            // Use the dynamicIP1CO for IP1 mapping, fallback to CO2 if not provided or invalid
            const relevantCOsForIP1 = dynamicIP1CO ? [dynamicIP1CO] : ["CO2"];
            const allCOs = ["CO1", "CO2", "CO3", "CO4", "CO5"]; // Still iterate all for filtering

            allCOs.forEach(co => { // Iterate through all COs for general remedial check
                const marksAllocatedKey = `MARKS ALLOCATED ${co}`;
                const attainmentPercentKey = `CO ATTAINMENT % ${co}`;
                const marksObtainedKey = `MARKS OBTAINED ${co}`;

                const marksAllocated = parseFloat(student[marksAllocatedKey]);
                const attainmentPercentValue = student[attainmentPercentKey];
                const attainmentPercent = attainmentPercentValue === "" || attainmentPercentValue === null || attainmentPercentValue === undefined ? NaN : parseFloat(attainmentPercentValue);

                if (!isNaN(marksAllocated) && marksAllocated > 0) {
                    if (!isNaN(attainmentPercent) && attainmentPercent < target) {
                        // For IP1 specific mapping, check if this CO is the dynamic target
                        if (relevantCOsForIP1.includes(co)) {
                             // Additionally check if filterCO is "All" or matches the current CO
                            if (filterCO === "All" || filterCO === co) {
                                needsRemedialForAtLeastOneCO = true;
                                studentRemedialCOs.push({
                                    coName: co,
                                    attainment: student[attainmentPercentKey],
                                    marksAllocated: student[marksAllocatedKey],
                                    marksObtained: student[marksObtainedKey]
                                });
                            }
                        }
                    }
                }
            });
        }
        if (studentRemedialCOs.length > 0) {
            remedialList.push({
                ...student,
                remedialCOsDetails: studentRemedialCOs
            });
        }
    });
    return remedialList;
};

function IP1COAttainmentResults({ onSendToBackend }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { convertedData } = location.state || {};

  const [summaryData, setSummaryData] = useState(null);
  const [showRemedialView, setShowRemedialView] = useState(false);
  const [remedialStudentList, setRemedialStudentList] = useState([]);
  const [selectedRemedialCO, setSelectedRemedialCO] = useState("All");
  const [lowestTest1AttainmentCO, setLowestTest1AttainmentCO] = useState(null); // NEW state for lowest CO

  // Target CO percentage for remedial identification (as per existing code for IP1)
  const targetCOPercent = 60;

  // Helper function to determine Attainment Level based on percentage
  const calculateAttainmentLevel = (achieved, total) => {
    const numericAchieved = parseFloat(achieved);
    if (isNaN(numericAchieved)) return "";

    if (typeof total !== 'undefined' && total !== null) {
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
    return "0"; // Less than 50%
  };

  // NEW: Helper function to format percentages (removes .00 if it's a whole number)
  const formatPercentageForDisplay = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    // Check if it's a whole number (e.g., 60.00 should become 60)
    if (num % 1 === 0) {
      return Math.round(num).toString();
    }
    // Otherwise, return with its original decimal places (e.g., 60.50 stays 60.50 or 60.5 if it was so)
    return num.toString();
  };


  useEffect(() => {
    // NEW: Retrieve the lowest Test1 attainment CO from localStorage
    const storedLowestCO = localStorage.getItem('lowestTest1AttainmentCO');
    if (storedLowestCO) {
        setLowestTest1AttainmentCO(storedLowestCO);
        console.log("IP1COAttainmentResults: Lowest Test 1 Attainment CO loaded:", storedLowestCO); // For debugging
    } else {
        console.log("IP1COAttainmentResults: No lowest Test 1 Attainment CO found in localStorage. Defaulting to CO2.");
        setLowestTest1AttainmentCO("CO2"); // Fallback to CO2 if not found
    }

    if (convertedData && convertedData.length > 0) {
      // Pass the dynamic CO to summary calculation based on what was loaded from localStorage
      calculateSummary(convertedData, storedLowestCO || "CO2");
    }
  }, [convertedData]); // Depend on convertedData

  // Recalculate remedial list whenever convertedData, selectedRemedialCO, or lowestTest1AttainmentCO changes
  useEffect(() => {
    if (showRemedialView && convertedData && convertedData.length > 0 && lowestTest1AttainmentCO) {
        const students = identifyRemedialStudentsList(convertedData, targetCOPercent, lowestTest1AttainmentCO, selectedRemedialCO);
        setRemedialStudentList(students);
    } else if (!showRemedialView) {
        setRemedialStudentList([]); // Clear list if view is closed
    }
  }, [showRemedialView, convertedData, selectedRemedialCO, targetCOPercent, lowestTest1AttainmentCO]);


  const calculateSummary = (data, ip1TargetCO) => {
    let totalStudentsPresentForIP1 = 0;
    data.forEach((row) => {
      const ip1Mark = String(row["IP1 Marks"]).toLowerCase();
      if (ip1Mark !== "" && ip1Mark !== "ab" && ip1Mark !== "absent") {
        totalStudentsPresentForIP1++;
      }
    });

    const achievedCounts = {
      CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0
    };
    const totalAttendedCounts = {
      CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0
    };
    const remedialCounts = {
      CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0
    };

    data.forEach((row) => {
        const ip1Mark = String(row["IP1 Marks"]).toLowerCase();
        const isPresent = ip1Mark !== "" && ip1Mark !== "ab" && ip1Mark !== "absent";

        if (isPresent) {
            ["CO1", "CO2", "CO3", "CO4", "CO5"].forEach(co => {
                const marksAllocatedKey = `MARKS ALLOCATED ${co}`;
                const attainmentPercentKey = `CO ATTAINMENT % ${co}`;

                const marksAllocated = parseFloat(row[marksAllocatedKey]);
                const attainmentPercent = parseFloat(row[attainmentPercentKey]);

                if (!isNaN(marksAllocated) && marksAllocated > 0) {
                    totalAttendedCounts[co]++;
                    if (!isNaN(attainmentPercent)) {
                        if (attainmentPercent >= targetCOPercent) {
                            achievedCounts[co]++;
                        } else if (attainmentPercent < targetCOPercent) {
                            remedialCounts[co]++;
                        }
                    } else {
                        // If attainment is NaN but marks were allocated, count as remedial
                        remedialCounts[co]++;
                    }
                }
            });
        }
    });

    const attainmentLevels = {
      CO1: "", CO2: "", CO3: "", CO4: "", CO5: ""
    };

    // Dynamically set the attainment level for the target IP1 CO
    if (ip1TargetCO && totalAttendedCounts[ip1TargetCO] > 0) {
        attainmentLevels[ip1TargetCO] = calculateAttainmentLevel(achievedCounts[ip1TargetCO], totalAttendedCounts[ip1TargetCO]);
    } else if (ip1TargetCO) {
        attainmentLevels[ip1TargetCO] = ""; // No students attended for this CO
    }

    setSummaryData({
      targetCOPercent,
      totalStudentsPresentForIP1,
      achievedCounts,
      totalAttendedCounts,
      remedialCounts,
      attainmentLevels,
      overallAttainmentLevel: attainmentLevels[ip1TargetCO], // Overall is the dynamic CO's level for IP1
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

    XLSX.utils.sheet_add_aoa(ws, [["CO Attainment Summary (IP1)"]], { origin: `A${currentRow + 1}` });
    // Adjusted merge range to exclude the 'Total' column from the summary title
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 5 } }); // "A" to "F" for CO1 to CO5 columns
    currentRow++;

    // Removed "Total" from the summary header row
    XLSX.utils.sheet_add_aoa(ws, [["", "CO1", "CO2", "CO3", "CO4", "CO5"]], { origin: `A${currentRow + 1}` });
    currentRow++;

    // Modified row2Data to show 'Total No. of Students appeared' only under CO1
    const row2Data = [
      "Total No. of Students appeared",
      summaryData.totalStudentsPresentForIP1, // Value under CO1
      "", // CO2 - empty
      "", // CO3 - empty
      "", // CO4 - empty
      "", // CO5 - empty
      // Removed "Total" value for this row
    ];
    XLSX.utils.sheet_add_aoa(ws, [row2Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row3Data = [
      "No. of Students Achieved the Target CO%",
      summaryData.achievedCounts.CO1,
      summaryData.achievedCounts.CO2,
      summaryData.achievedCounts.CO3,
      summaryData.achievedCounts.CO4,
      summaryData.achievedCounts.CO5,
      // Removed "Total" value for this row
    ];
    XLSX.utils.sheet_add_aoa(ws, [row3Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row4Data = [
      "Attainment Level",
      summaryData.attainmentLevels.CO1,
      summaryData.attainmentLevels.CO2,
      summaryData.attainmentLevels.CO3,
      summaryData.attainmentLevels.CO4,
      summaryData.attainmentLevels.CO5,
      // Removed "Total" value for this row
    ];
    XLSX.utils.sheet_add_aoa(ws, [row4Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row5Data = [
      "Total No. of Students who need Remedial Class",
      summaryData.remedialCounts.CO1,
      summaryData.remedialCounts.CO2,
      summaryData.remedialCounts.CO3,
      summaryData.remedialCounts.CO4,
      summaryData.remedialCounts.CO5,
      // Removed "Total" value for this row
    ];
    XLSX.utils.sheet_add_aoa(ws, [row5Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: `A${currentRow + 1}` });
    currentRow++;


    const mainHeaderStartRow = currentRow;

    const mainDataHeaderRow1 = [
      "S.No", "Reg.No",
      "MARKS ALLOCATED", null, null, null, null,
      "MARKS OBTAINED", null, null, null, null,
      "CO ATTAINMENT %", null, null, null, null,
      "ATTAINMENT of COs", null, null, null, null,
      "IP1 Marks"
    ];
    const mainDataHeaderRow2 = [
      null, null,
      "CO1", "CO2", "CO3", "CO4", "CO5",
      "CO1", "CO2", "CO3", "CO4", "CO5",
      "CO1", "CO2", "CO3", "CO4", "CO5",
      "CO1", "CO2", "CO3", "CO4", "CO5",
      null
    ];

    XLSX.utils.sheet_add_aoa(ws, [mainDataHeaderRow1, mainDataHeaderRow2], { origin: `A${currentRow + 1}` });
    currentRow += 2;

    const ip1DataAsAoA = convertedData.map(row => [
      row["S.No"],
      row["Reg.No"],
      row["MARKS ALLOCATED CO1"],
      // Display empty string if MARKS ALLOCATED CO2 is 0 or undefined, else display value
      row["MARKS ALLOCATED CO2"] === 0 ? "" : row["MARKS ALLOCATED CO2"],
      row["MARKS ALLOCATED CO3"] === 0 ? "" : row["MARKS ALLOCATED CO3"],
      row["MARKS ALLOCATED CO4"] === 0 ? "" : row["MARKS ALLOCATED CO4"],
      row["MARKS ALLOCATED CO5"] === 0 ? "" : row["MARKS ALLOCATED CO5"],
      row["MARKS OBTAINED CO1"],
      // Modified to display empty string if MARKS OBTAINED CO2 is 0 or undefined
      row["MARKS OBTAINED CO2"] === 0 ? "" : row["MARKS OBTAINED CO2"],
      row["MARKS OBTAINED CO3"] === 0 ? "" : row["MARKS OBTAINED CO3"],
      row["MARKS OBTAINED CO4"] === 0 ? "" : row["MARKS OBTAINED CO4"],
      row["MARKS OBTAINED CO5"] === 0 ? "" : row["MARKS OBTAINED CO5"],
      formatPercentageForDisplay(row["CO ATTAINMENT % CO1"]), // Applied formatting
      formatPercentageForDisplay(row["CO ATTAINMENT % CO2"]), // Applied formatting
      formatPercentageForDisplay(row["CO ATTAINMENT % CO3"]), // Applied formatting
      formatPercentageForDisplay(row["CO ATTAINMENT % CO4"]), // Applied formatting
      formatPercentageForDisplay(row["CO ATTAINMENT % CO5"]), // Applied formatting
      calculateAttainmentLevel(row["CO ATTAINMENT % CO1"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO2"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO3"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO4"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO5"]),
      row["IP1 Marks"]
    ]);
    XLSX.utils.sheet_add_aoa(ws, ip1DataAsAoA, { origin: `A${currentRow + 1}` });

    merges.push({ s: { r: mainHeaderStartRow, c: 0 }, e: { r: mainHeaderStartRow + 1, c: 0 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 1 }, e: { r: mainHeaderStartRow + 1, c: 1 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 2 }, e: { r: mainHeaderStartRow, c: 6 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 7 }, e: { r: mainHeaderStartRow, c: 11 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 12 }, e: { r: mainHeaderStartRow, c: 16 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 17 }, e: { r: mainHeaderStartRow, c: 21 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 22 }, e: { r: mainHeaderStartRow + 1, c: 22 } });

    ws["!cols"] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "IP1_CO_Attainment_Results");
    XLSX.writeFile(wb, "IP1_CO_Attainment_Results_with_Summary.xlsx");
  };

  const handleExportRemedialExcel = () => {
    if (!remedialStudentList || remedialStudentList.length === 0) {
      alert("No remedial student data to export.");
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = {};
    const merges = [];

    let currentRow = 0;

    XLSX.utils.sheet_add_aoa(ws, [["Remedial Students List (IP1)"]], { origin: `A${currentRow + 1}` });
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 22 } }); // Adjust colspan as needed
    currentRow++;

    // Add a row to indicate the filtered CO if applicable
    if (selectedRemedialCO !== "All") {
        XLSX.utils.sheet_add_aoa(ws, [[`Filtered by CO: ${selectedRemedialCO}`]], { origin: `A${currentRow + 1}` });
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 22 } });
        currentRow++;
    }
    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: `A${currentRow + 1}` }); // Empty row for spacing
    currentRow++;


    const mainHeaderStartRow = currentRow;

    const mainDataHeaderRow1 = [
      "S.No", "Reg.No",
      "MARKS ALLOCATED", null, null, null, null,
      "MARKS OBTAINED", null, null, null, null,
      "CO ATTAINMENT %", null, null, null, null,
      "ATTAINMENT of COs", null, null, null, null,
      "IP1 Marks",
      // Removed "Remedial COs" column
    ];
    const mainDataHeaderRow2 = [
      null, null,
      "CO1", "CO2", "CO3", "CO4", "CO5",
      "CO1", "CO2", "CO3", "CO4", "CO5",
      "CO1", "CO2", "CO3", "CO4", "CO5",
      "CO1", "CO2", "CO3", "CO4", "CO5",
      null,
      // Removed null for "Remedial COs"
    ];

    XLSX.utils.sheet_add_aoa(ws, [mainDataHeaderRow1, mainDataHeaderRow2], { origin: `A${currentRow + 1}` });
    currentRow += 2;

    const remedialDataAsAoA = remedialStudentList.map((row, index) => [
      index + 1, // S.No for remedial list
      row["Reg.No"],
      row["MARKS ALLOCATED CO1"],
      row["MARKS ALLOCATED CO2"] === 0 ? "" : row["MARKS ALLOCATED CO2"],
      row["MARKS ALLOCATED CO3"] === 0 ? "" : row["MARKS ALLOCATED CO3"],
      row["MARKS ALLOCATED CO4"] === 0 ? "" : row["MARKS ALLOCATED CO4"],
      row["MARKS ALLOCATED CO5"] === 0 ? "" : row["MARKS ALLOCATED CO5"],
      row["MARKS OBTAINED CO1"],
      row["MARKS OBTAINED CO2"] === 0 ? "" : row["MARKS OBTAINED CO2"],
      row["MARKS OBTAINED CO3"] === 0 ? "" : row["MARKS OBTAINED CO3"],
      row["MARKS OBTAINED CO4"] === 0 ? "" : row["MARKS OBTAINED CO4"],
      row["MARKS OBTAINED CO5"] === 0 ? "" : row["MARKS OBTAINED CO5"],
      formatPercentageForDisplay(row["CO ATTAINMENT % CO1"]),
      formatPercentageForDisplay(row["CO ATTAINMENT % CO2"]),
      formatPercentageForDisplay(row["CO ATTAINMENT % CO3"]),
      formatPercentageForDisplay(row["CO ATTAINMENT % CO4"]),
      formatPercentageForDisplay(row["CO ATTAINMENT % CO5"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO1"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO2"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO3"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO4"]),
      calculateAttainmentLevel(row["CO ATTAINMENT % CO5"]),
      row["IP1 Marks"],
      // Removed remedialCOsDetails mapping
    ]);
    XLSX.utils.sheet_add_aoa(ws, remedialDataAsAoA, { origin: `A${currentRow + 1}` });

    // Merges for the main data header
    merges.push({ s: { r: mainHeaderStartRow, c: 0 }, e: { r: mainHeaderStartRow + 1, c: 0 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 1 }, e: { r: mainHeaderStartRow + 1, c: 1 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 2 }, e: { r: mainHeaderStartRow, c: 6 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 7 }, e: { r: mainHeaderStartRow, c: 11 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 12 }, e: { r: mainHeaderStartRow, c: 16 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 17 }, e: { r: mainHeaderStartRow, c: 21 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 22 }, e: { r: mainHeaderStartRow + 1, c: 22 } });
    // Removed merge for Remedial COs column

    ws["!merges"] = merges;
    ws["!cols"] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 15 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        // Removed width for Remedial COs column
    ];


    XLSX.utils.book_append_sheet(wb, ws, "IP1_Remedial_Students");
    XLSX.writeFile(wb, "IP1_Remedial_Students.xlsx");
  };

  const handleViewRemedial = () => {
    if (convertedData && convertedData.length > 0) {
        setSelectedRemedialCO("All"); // Default to "All" CO for remedial view
        setShowRemedialView(prev => !prev);
    } else {
        alert("No data available to view remedial students.");
    }
  };


  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">IP1 CO Attainment Results</h2>

      <div className="mt-4 flex space-x-4 justify-center">
        <CustomButton
          label="Back"
          onClick={handleBack}
          others="bg-gray-500 hover:bg-gray-700"
        />
        <CustomButton
          label="Export as Excel"
          onClick={handleExportExcel}
          others="bg-blue-500 hover:bg-blue-700"
        />
        <CustomButton
          label="Send to Backend"
          onClick={() => onSendToBackend(convertedData, "uploadIP1COAttainment")}
          others="bg-green-500 hover:bg-green-700"
        />
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
                    others="bg-yellow-500 hover:bg-yellow-700"
                />
                <select
                    className="p-2 border rounded shadow"
                    value={selectedRemedialCO}
                    onChange={(e) => setSelectedRemedialCO(e.target.value)}
                >
                    <option value="All">All COs</option>
                    <option value="CO1">CO1</option>
                    <option value="CO2">CO2</option>
                    <option value="CO3">CO3</option>
                    <option value="CO4">CO4</option>
                    <option value="CO5">CO5</option>
                </select>
            </>
        )}
      </div>

      {summaryData && !showRemedialView && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-800">CO Attainment Summary (IP1)</h3>
          {lowestTest1AttainmentCO && (
            <p className="mb-4 text-sm text-gray-600">
              *IP1 Marks are now mapped to **{lowestTest1AttainmentCO}** based on the lowest attainment level from Test 1.
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
                  {/* Removed the 'Total' column header */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Total No. of Students appeared</td>
                  {/* Display 'Total No. of Students appeared' only under CO1 */}
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {summaryData.totalStudentsPresentForIP1}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r"></td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r"></td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r"></td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700"></td>
                  {/* Removed 'Total' data cell */}
                </tr>
                <tr>
                  <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900 border-r">No. of Students Achieved the Target CO%</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO1}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO2}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO3}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO4}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700">
                    {summaryData.achievedCounts.CO5}
                  </td>
                  {/* Removed 'Total' data cell */}
                </tr>
                <tr>
                  <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Attainment Level</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO1}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO2}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO3}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO4}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700">
                    {summaryData.attainmentLevels.CO5}
                  </td>
                  {/* Removed 'Total' data cell */}
                </tr>
                <tr>
                  <td className="px-2 py-1 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Total No. of Students who need Remedial Class</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO1}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO2}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO3}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO4}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700">
                    {summaryData.remedialCounts.CO5}
                  </td>
                  {/* Removed 'Total' data cell */}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {convertedData && convertedData.length > 0 ? (
        <div className="mt-6 overflow-x-auto shadow-md sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th rowSpan="2" className="px-4 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">S.No</th>
                <th rowSpan="2" className="px-4 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">Reg.No</th>
                <th colSpan="5" className="px-4 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">MARKS ALLOCATED</th>
                <th colSpan="5" className="px-4 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">MARKS OBTAINED</th>
                <th colSpan="5" className="px-4 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">CO ATTAINMENT %</th>
                <th colSpan="5" className="px-4 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">ATTAINMENT of COs</th>
                <th rowSpan="2" className="px-4 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2">IP1 Marks</th>
                {/* Removed Remedial COs column header */}
              </tr>
              <tr>
                {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (
                  <th key={`allocated-${co}`} className="px-2 py-1 text-center text-xs font-medium text-black-100 uppercase tracking-wider border-r">{co}</th>
                ))}
                {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (
                  <th key={`obtained-${co}`} className="px-2 py-1 text-center text-xs font-medium text-black-100 uppercase tracking-wider border-r">{co}</th>
                ))}
                {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (
                  <th key={`attainment-percent-${co}`} className="px-2 py-1 text-center text-xs font-medium text-black-100 uppercase tracking-wider border-r">{co}</th>
                ))}
                {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (
                  <th key={`attainment-level-${co}`} className="px-2 py-1 text-center text-xs font-medium text-black-100 uppercase tracking-wider border-r">{co}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
  {(showRemedialView ? remedialStudentList : convertedData).map((row, index) => (
    <tr key={index}>
      {/* MODIFICATION HERE: Use index + 1 for S.No when showing remedial view */}
      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r">
        {showRemedialView ? index + 1 : row["S.No"]}
      </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r">{row["Reg.No"]}</td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS ALLOCATED CO1"]}
                  </td>
                  {/* Modified to display empty string if MARKS ALLOCATED CO2 is 0 or undefined */}
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS ALLOCATED CO2"] === 0 ? "" : row["MARKS ALLOCATED CO2"]}
                  </td>
                  {/* Modified to display empty string if MARKS ALLOCATED CO3 is 0 or undefined */}
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS ALLOCATED CO3"] === 0 ? "" : row["MARKS ALLOCATED CO3"]}
                  </td>
                  {/* Modified to display empty string if MARKS ALLOCATED CO4 is 0 or undefined */}
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS ALLOCATED CO4"] === 0 ? "" : row["MARKS ALLOCATED CO4"]}
                  </td>
                  {/* Modified to display empty string if MARKS ALLOCATED CO5 is 0 or undefined */}
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS ALLOCATED CO5"] === 0 ? "" : row["MARKS ALLOCATED CO5"]}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS OBTAINED CO1"]}
                  </td>
                  {/* Modified to display empty string if MARKS OBTAINED CO2 is 0 or undefined */}
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS OBTAINED CO2"] === 0 ? "" : row["MARKS OBTAINED CO2"]}
                  </td>
                  {/* Modified to display empty string if MARKS OBTAINED CO3 is 0 or undefined */}
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS OBTAINED CO3"] === 0 ? "" : row["MARKS OBTAINED CO3"]}
                  </td>
                  {/* Modified to display empty string if MARKS OBTAINED CO4 is 0 or undefined */}
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS OBTAINED CO4"] === 0 ? "" : row["MARKS OBTAINED CO4"]}
                  </td>
                  {/* Modified to display empty string if MARKS OBTAINED CO5 is 0 or undefined */}
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {row["MARKS OBTAINED CO5"] === 0 ? "" : row["MARKS OBTAINED CO5"]}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {formatPercentageForDisplay(row["CO ATTAINMENT % CO1"])}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {formatPercentageForDisplay(row["CO ATTAINMENT % CO2"])}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {formatPercentageForDisplay(row["CO ATTAINMENT % CO3"])}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {formatPercentageForDisplay(row["CO ATTAINMENT % CO4"])}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {formatPercentageForDisplay(row["CO ATTAINMENT % CO5"])}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {calculateAttainmentLevel(row["CO ATTAINMENT % CO1"])}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {calculateAttainmentLevel(row["CO ATTAINMENT % CO2"])}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {calculateAttainmentLevel(row["CO ATTAINMENT % CO3"])}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {calculateAttainmentLevel(row["CO ATTAINMENT % CO4"])}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-center text-sm text-gray-700 border-r">
                    {calculateAttainmentLevel(row["CO ATTAINMENT % CO5"])}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {row["IP1 Marks"]}
                  </td>
                  {/* Removed Remedial COs data cell */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 text-center text-red-500">
          No IP1 CO Attainment data available. Please upload an Excel file and click "IP1 CO Attainment" from the IP page.
        </div>
      )}
    </div>
  );
}

export default IP1COAttainmentResults;