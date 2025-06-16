import React, { useEffect, useState, useCallback } from "react";
import CustomButton from "../../../compounds/button";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // Import XLSX for Excel export

// Helper function to identify students needing remedial classes
const identifyRemedialStudentsList = (data, targetCOPercent, filterCO = "All") => {
    if (!data) return [];
    const remedialList = [];
    const target = parseFloat(targetCOPercent);

    data.forEach(student => {
        const pt1Mark = String(student["PT1"]).toLowerCase();
        const isPresent = pt1Mark !== "" && pt1Mark !== "ab" && pt1Mark !== "absent";
        let needsRemedialForAtLeastOneCO = false;
        const studentRemedialCOs = []; // Store COs for which this student needs remedial

        if (isPresent) {
            const cos = ["CO1", "CO2", "CO3", "CO4", "CO5"];
            cos.forEach(co => {
                const marksAllocatedKey = `MARKS ALLOCATED ${co}`;
                const attainmentPercentKey = `CO ATTAINMENT % ${co}`;
                const marksObtainedKey = `MARKS OBTAINED ${co}`;

                const marksAllocated = parseFloat(student[marksAllocatedKey]);
                const attainmentPercentValue = student[attainmentPercentKey];
                // Ensure attainmentPercent is treated as a number.
                const attainmentPercent = attainmentPercentValue === "" || attainmentPercentValue === null || attainmentPercentValue === undefined ? NaN : parseFloat(attainmentPercentValue);

                if (!isNaN(marksAllocated) && marksAllocated > 0) {
                    if (!isNaN(attainmentPercent) && attainmentPercent < target) {
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

// Helper function to determine Attainment Level based on percentage (for individual student display)
const getIndividualAttainmentLevel = (percentage) => {
    const numericPercentage = parseFloat(percentage);
    if (isNaN(numericPercentage)) {
        return ""; // Return empty if not a valid number
    }
    if (numericPercentage >= 60) {
        return 1;
    } else {
        return 0; // Less than 60%
    }
};

// Helper function to determine Summary Attainment Level based on percentage of students achieved
const getSummaryAttainmentLevel = (percentageOfStudentsAchieved) => {
    const numericPercentage = parseFloat(percentageOfStudentsAchieved);
    if (isNaN(numericPercentage)) {
        return "";
    }
    if (numericPercentage >= 70) {
        return 3;
    } else if (numericPercentage >= 60) {
        return 2;
    } else if (numericPercentage >= 50) {
        return 1;
    } else {
        return 0;
    }
};

// Helper function to find the CO with the lowest attainment level
// Helper function to find the CO with the lowest attainment level from CO1 and CO2
const findLowestAttainmentCO = (attainmentLevelsSummary) => {
    let lowestAttainment = Infinity;
    let lowestCO = '';
    // This array now correctly ensures only CO1 and CO2 are checked.
    const relevantCOs = ["CO1", "CO2"]; 

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


function Test1({ onExport, onSendToBackend }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { convertedData } = location.state || {};

    const [summaryData, setSummaryData] = useState(null); // New state for summary data
    const [showRemedialView, setShowRemedialView] = useState(false);
    const [remedialStudentList, setRemedialStudentList] = useState([]);
    const [selectedRemedialCO, setSelectedRemedialCO] = useState("All");

    const targetCOPercent = 60; // Target CO percentage for remedial identification

    useEffect(() => {
        if (convertedData && convertedData.length > 0) {
            calculateSummary(convertedData);
        }
    }, [convertedData]);

    useEffect(() => {
        if (showRemedialView && convertedData && convertedData.length > 0) {
            const students = identifyRemedialStudentsList(convertedData, targetCOPercent, selectedRemedialCO);
            setRemedialStudentList(students);
        } else if (!showRemedialView) {
            setRemedialStudentList([]);
        }
    }, [showRemedialView, convertedData, selectedRemedialCO, targetCOPercent]);

    const calculateSummary = useCallback((data) => {
        let totalStudentsPresentForPT1 = 0;
        data.forEach(row => {
            const pt1Mark = String(row["PT1"]).toLowerCase();
            if (pt1Mark !== "" && pt1Mark !== "ab" && pt1Mark !== "absent") {
                totalStudentsPresentForPT1++;
            }
        });

        const achievedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const totalAttendedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const remedialCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 };
        const calculatedAttainmentPercentages = {};

        data.forEach(row => {
            const pt1Mark = String(row["PT1"]).toLowerCase();
            const isPresent = pt1Mark !== "" && pt1Mark !== "ab" && pt1Mark !== "absent";

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
                            remedialCounts[co]++;
                        }
                    }
                });
            }
        });

        const attainmentLevelsSummary = {};
        for (const co in achievedCounts) {
            if (totalAttendedCounts[co] > 0) {
                const percentageOfStudentsAchievedForCO = ((achievedCounts[co] / totalAttendedCounts[co]) * 100);
                calculatedAttainmentPercentages[co] = percentageOfStudentsAchievedForCO.toFixed(2);
                attainmentLevelsSummary[co] = getSummaryAttainmentLevel(percentageOfStudentsAchievedForCO);
            } else {
                attainmentLevelsSummary[co] = "";
                calculatedAttainmentPercentages[co] = "";
            }
        }

        // Determine the lowest attainment CO and store it in localStorage
        const lowestCO = findLowestAttainmentCO(attainmentLevelsSummary);
        if (lowestCO) {
            localStorage.setItem('lowestAttainmentCO', lowestCO);
        } else {
            localStorage.removeItem('lowestAttainmentCO');
        }

        const relevantCOs = ["CO1", "CO2", "CO3", "CO4", "CO5"];
        const totalAchievedStudentsAllCOs = relevantCOs.reduce((sum, co) => sum + (achievedCounts[co] || 0), 0);
        const totalRelevantAttendedStudents = relevantCOs.reduce((sum, co) => sum + (totalAttendedCounts[co] || 0), 0);
        const totalRemedialStudentsAllCOs = relevantCOs.reduce((sum, co) => sum + (remedialCounts[co] || 0), 0);

        const overallAttainmentPercentage = totalRelevantAttendedStudents > 0
            ? ((totalAchievedStudentsAllCOs / totalRelevantAttendedStudents) * 100).toFixed(2)
            : "";

        const overallAttainmentLevelSummary = totalRelevantAttendedStudents > 0
            ? getSummaryAttainmentLevel(overallAttainmentPercentage)
            : "";


        setSummaryData({
            totalStudentsPresentForPT1,
            achievedCounts,
            attainmentLevels: attainmentLevelsSummary,
            remedialCounts,
            totalAchievedStudentsAllCOs,
            overallAttainmentLevel: overallAttainmentLevelSummary,
            totalRemedialStudentsAllCOs,
            calculatedAttainmentPercentages,
        });
    }, [targetCOPercent]); // Add targetCOPercent to useCallback dependencies

const handleSendToBackend = () => {
        if (convertedData && convertedData.length > 0) {
            // Assuming a course code is known. In a real app, this might come from user selection.
            const courseCode = "CS101"; 
            
            fetch(`http://localhost:8080/api/course/${courseCode}/test1`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(convertedData),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                alert('Test 1 data saved to the backend successfully!');
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Failed to save Test 1 data to the backend.');
            });

        } else {
            alert("No data to send to backend.");
        }
    };
    const handleBack = () => {
        navigate(-1);
    };

    const handleExportExcel = () => {
    if (!summaryData || !convertedData || convertedData.length === 0) {
        alert("No data or summary to export. Please ensure data is processed.");
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws = {};
    const merges = [];
    let currentRow = 0;

    // Summary section
    XLSX.utils.sheet_add_aoa(ws, [["CO Attainment Summary (PT1)"]], { origin: `A${currentRow + 1}` });
    // Adjust merge for the title row: c: 5 instead of c: 6 as "Total" column is removed
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 5 } });
    currentRow++;

    // Remove "Total" from the header row for summary
    XLSX.utils.sheet_add_aoa(ws, [["", "CO1", "CO2", "CO3", "CO4", "CO5"]], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row2Data = [
        "Total No. of Students appeared",
        summaryData.totalStudentsPresentForPT1, null, null, null, null // Removed the last 'summaryData.totalStudentsPresentForPT1' for "Total"
    ];
    XLSX.utils.sheet_add_aoa(ws, [row2Data], { origin: `A${currentRow + 1}` });
    // Merge the CO cells for "Total No. of Students appeared" row (no change here as it spans CO columns)
    merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 5 } });
    currentRow++;

    const row3Data = [
        "No. of Students Achieved the Target CO%",
        summaryData.achievedCounts.CO1, summaryData.achievedCounts.CO2, summaryData.achievedCounts.CO3,
        summaryData.achievedCounts.CO4, summaryData.achievedCounts.CO5 // Removed the 'null' at the end as "Total" column is gone
    ];
    XLSX.utils.sheet_add_aoa(ws, [row3Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row4Data = [
        "Attainment Level",
        summaryData.attainmentLevels.CO1, summaryData.attainmentLevels.CO2, summaryData.attainmentLevels.CO3,
        summaryData.attainmentLevels.CO4, summaryData.attainmentLevels.CO5,
        null // Changed from summaryData.overallAttainmentLevel to null
    ];
    XLSX.utils.sheet_add_aoa(ws, [row4Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    const row5Data = [
        "Total No. of Students who need Remedial Class",
        summaryData.remedialCounts.CO1, summaryData.remedialCounts.CO2, summaryData.remedialCounts.CO3,
        summaryData.remedialCounts.CO4, summaryData.remedialCounts.CO5,
        null // Changed from summaryData.totalRemedialStudentsAllCOs to null
    ];
    XLSX.utils.sheet_add_aoa(ws, [row5Data], { origin: `A${currentRow + 1}` });
    currentRow++;

    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: `A${currentRow + 1}` }); // Empty spacer row
    currentRow++;

    // Detailed student data section
    const mainHeaderStartRow = currentRow;
    const mainDataHeaderRow1 = [
        "S.No", "Reg.No", "MARKS ALLOCATED", null, null, null, null,
        "MARKS OBTAINED", null, null, null, null, "CO ATTAINMENT %", null, null, null, null,
        "ATTAINMENT of COs", null, null, null, null, "PT1 Marks"
    ];
    const mainDataHeaderRow2 = [
        null, null, "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5",
        "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", null
    ];
    XLSX.utils.sheet_add_aoa(ws, [mainDataHeaderRow1, mainDataHeaderRow2], { origin: `A${currentRow + 1}` });
    currentRow += 2;

    const test1DataAsAoA = convertedData.map(row => [
        row["S.No"], // Use original S.No for the full data export
        row["Reg.No"],
        row["MARKS ALLOCATED CO1"],
        row["MARKS ALLOCATED CO2"],
        row["MARKS ALLOCATED CO3"],
        row["MARKS ALLOCATED CO4"],
        row["MARKS ALLOCATED CO5"],
        row["MARKS OBTAINED CO1"],
        row["MARKS OBTAINED CO2"],
        row["MARKS OBTAINED CO3"],
        row["MARKS OBTAINED CO4"],
        row["MARKS OBTAINED CO5"],
        row["CO ATTAINMENT % CO1"],
        row["CO ATTAINMENT % CO2"],
        row["CO ATTAINMENT % CO3"],
        row["CO ATTAINMENT % CO4"],
        row["CO ATTAINMENT % CO5"],
        getIndividualAttainmentLevel(row["CO ATTAINMENT % CO1"]),
        getIndividualAttainmentLevel(row["CO ATTAINMENT % CO2"]),
        getIndividualAttainmentLevel(row["CO ATTAINMENT % CO3"]),
        getIndividualAttainmentLevel(row["CO ATTAINMENT % CO4"]),
        getIndividualAttainmentLevel(row["CO ATTAINMENT % CO5"]),
        row["PT1"]
    ]);
    XLSX.utils.sheet_add_aoa(ws, test1DataAsAoA, { origin: `A${currentRow + 1}` });

    // Merges for the detailed section
    merges.push({ s: { r: mainHeaderStartRow, c: 0 }, e: { r: mainHeaderStartRow + 1, c: 0 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 1 }, e: { r: mainHeaderStartRow + 1, c: 1 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 2 }, e: { r: mainHeaderStartRow, c: 6 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 7 }, e: { r: mainHeaderStartRow, c: 11 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 12 }, e: { r: mainHeaderStartRow, c: 16 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 17 }, e: { r: mainHeaderStartRow, c: 21 } });
    merges.push({ s: { r: mainHeaderStartRow, c: 22 }, e: { r: mainHeaderStartRow + 1, c: 22 } });

    ws["!merges"] = merges;
    ws["!cols"] = [
        { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 10 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Test1_Results_Summary");
    XLSX.writeFile(wb, "Test1_Results_Summary.xlsx");
};

    const handleExportRemedialExcel = () => {
    if (!remedialStudentList || remedialStudentList.length === 0) {
        alert("No remedial students to export.");
        return;
    }

    const wb = XLSX.utils.book_new();
    const ws_name = "Remedial_Students";
    const ws_data = [
        ["Remedial Students List (Test 1)"],
        [], // Spacer row
        // Add "Name" to the header row
        ["S.No", "Reg.No", "Name", "PT1 Marks", "CO Needing Remedial", "Attainment %", "Marks Allocated", "Marks Obtained"]
    ];

    // Use index + 1 for S.No in the remedial export
    remedialStudentList.forEach((student, index) => {
        const studentName = student["Name"] || ""; // Get student name, provide default if undefined
        student.remedialCOsDetails.forEach(coDetail => {
            ws_data.push([
                index + 1, // Sequential S.No for remedial list
                student["Reg.No"],
                studentName, // Add student name here
                student["PT1"],
                coDetail.coName,
                coDetail.attainment,
                coDetail.marksAllocated,
                coDetail.marksObtained
            ]);
        });
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Adjust merge for the title to span 8 columns (0 to 7)
    const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]; // Merge title row

    // Adjust column widths, adding one for "Name"
    ws['!cols'] = [
        { wch: 8 },  // S.No
        { wch: 15 }, // Reg.No
        { wch: 20 }, // Name (new column)
        { wch: 12 }, // PT1 Marks
        { wch: 20 }, // CO Needing Remedial
        { wch: 15 }, // Attainment %
        { wch: 15 }, // Marks Allocated
        { wch: 15 }  // Marks Obtained
    ];

    ws['!merges'] = merges;

    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    XLSX.writeFile(wb, "Test1_Remedial_Students.xlsx");
};

//    const handleSendToBackend = () => {
//     if (convertedData && convertedData.length > 0) {
//         // Assume courseCode is available from state or props
//         const courseCode = "CS101"; // Example

//         fetch(`http://localhost:8080/api/course/${courseCode}/test1-results`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(convertedData),
//         })
//         .then(response => response.json())
//         .then(data => {
//             console.log('Success:', data);
//             alert('Test 1 data saved to the backend successfully!');
//         })
//         .catch((error) => {
//             console.error('Error:', error);
//             alert('Failed to save data to the backend.');
//         });

//     } else {
//         alert("No data to send to backend.");
//     }
// };

    const handleToggleRemedialView = () => {
        setShowRemedialView(prev => !prev);
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4 text-center">Test 1 Results</h2>

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
                    onClick={handleSendToBackend}
                    others="bg-green-500 hover:bg-green-700"
                />
                <CustomButton
                    label={showRemedialView ? "View All Students" : "View Remedial Students"}
                    onClick={handleToggleRemedialView}
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
                            <option value="CO1">CO1</option>
                            <option value="CO2">CO2</option>
                            <option value="CO3">CO3</option>
                            <option value="CO4">CO4</option>
                            <option value="CO5">CO5</option>
                        </select>
                    </>
                )}
            </div>

            {/* Conditional rendering for Summary Table */}
            {summaryData && !showRemedialView && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">CO Attainment Summary (PT1)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r"></th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">CO1</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">CO2</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">CO3</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">CO4</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">CO5</th>
                                    {/* Removed: <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th> */}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Total No. of Students appeared</td>
                                    {/* colSpan is 5 here because it spans CO1-CO5 */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r" colSpan="5">{summaryData.totalStudentsPresentForPT1}</td>
                                    {/* Removed: <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.totalStudentsPresentForPT1}</td> */}
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">No. of Students Achieved the Target CO%</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO2}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO3}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO4}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.achievedCounts.CO5}</td>
                                    {/* Removed: <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.totalAchievedStudentsAllCOs}</td> */}
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Attainment Level</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO2}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO3}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO4}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.attainmentLevels.CO5}</td>
                                    {/* Removed: <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.overallAttainmentLevel}</td> */}
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Total No. of Students who need Remedial Class</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO2}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO3}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO4}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.remedialCounts.CO5}</td>
                                    {/* Removed: <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.totalRemedialStudentsAllCOs}</td> */}
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
                                <th rowSpan="2" className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">S.No</th>
                                <th rowSpan="2" className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">Reg.No</th>
                                <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">MARKS ALLOCATED</th>
                                <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">MARKS OBTAINED</th>
                                <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">CO ATTAINMENT %</th>
                                <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2 border-r">ATTAINMENT of COs</th>
                                <th rowSpan="2" className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2">PT1 Marks</th>
                            </tr>
                            <tr>
                                {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (
                                    <th key={`allocated-${co}`} className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-r">{co}</th>
                                ))}
                                {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (
                                    <th key={`obtained-${co}`} className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-r">{co}</th>
                                ))}
                                {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (
                                    <th key={`attainment-percent-${co}`} className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-r">{co}</th>
                                ))}
                                {["CO1", "CO2", "CO3", "CO4", "CO5"].map(co => (
                                    <th key={`attainment-level-${co}`} className="px-3 py-2 text-center text-xs font-medium black-gray-500 uppercase tracking-wider border-r">{co}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {(showRemedialView ? remedialStudentList : convertedData).map((row, index) => (
                                <tr key={row["Reg.No"] || index}>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r">
                                        {showRemedialView ? index + 1 : row["S.No"]}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 border-r">{row["Reg.No"]}</td>
                                    
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS ALLOCATED CO1"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS ALLOCATED CO2"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS ALLOCATED CO3"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS ALLOCATED CO4"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS ALLOCATED CO5"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS OBTAINED CO1"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS OBTAINED CO2"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS OBTAINED CO3"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS OBTAINED CO4"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["MARKS OBTAINED CO5"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["CO ATTAINMENT % CO1"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["CO ATTAINMENT % CO2"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["CO ATTAINMENT % CO3"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["CO ATTAINMENT % CO4"]}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["CO ATTAINMENT % CO5"]}</td>
                                    {/* Use getIndividualAttainmentLevel here */}
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO1"])}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO2"])}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO3"])}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO4"])}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO5"])}</td>
                                    <td className="px-3 py-2 border-r text-center text-gray-700">{row["PT1"]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mt-6 text-center text-red-500">
                    No Test 1 data available. Please upload an Excel file and click "Test 1" from the Theory page.
                </div>
            )}
        </div>
    );
}

export default Test1;