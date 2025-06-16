import React, { useEffect, useState, useCallback } from "react";
import CustomButton from "../../../compounds/button"; //
import { useLocation, useNavigate } from "react-router-dom"; //
import * as XLSX from "xlsx"; //

// Helper function to identify students needing remedial classes (aligned with Test1.js)
const identifyRemedialStudentsList = (data, targetCOPercent, filterCO = "All") => { //
  if (!data) return []; //
  const remedialList = []; //
  const target = parseFloat(targetCOPercent); //

  data.forEach(student => { //
    const ptMark = String(student["PT2"]).toLowerCase(); //
    const isPresent = ptMark !== "" && ptMark !== "ab" && ptMark !== "absent"; //
    const studentRemedialCOs = []; //

    if (isPresent) { //
      const cos = ["CO1", "CO2", "CO3", "CO4", "CO5"]; //
      cos.forEach(co => { //
        const marksAllocatedKey = `MARKS ALLOCATED ${co}`; //
        const attainmentPercentKey = `CO ATTAINMENT % ${co}`; //
        const marksObtainedKey = `MARKS OBTAINED ${co}`; //

        const marksAllocated = parseFloat(student[marksAllocatedKey]); //
        const attainmentPercentValue = student[attainmentPercentKey]; //
        const attainmentPercent = attainmentPercentValue === "" || attainmentPercentValue === null || attainmentPercentValue === undefined ? NaN : parseFloat(attainmentPercentValue); //

        if (!isNaN(marksAllocated) && marksAllocated > 0) { //
          if (!isNaN(attainmentPercent) && attainmentPercent < target) { //
            if (filterCO === "All" || filterCO === co) { //
              studentRemedialCOs.push({ //
                coName: co, //
                attainment: student[attainmentPercentKey], //
                marksAllocated: student[marksAllocatedKey], //
                marksObtained: student[marksObtainedKey] //
              });
            }
          }
        }
      });
    }
    if (studentRemedialCOs.length > 0) { //
      remedialList.push({ //
        ...student, //
        remedialCOsDetails: studentRemedialCOs //
      });
    }
  });
  return remedialList; //
};

// Helper function to determine Attainment Level based on percentage (for individual student display)
const getIndividualAttainmentLevel = (percentage) => { //
  const numericPercentage = parseFloat(percentage); //
  if (isNaN(numericPercentage)) { //
    return ""; //
  }
  if (numericPercentage >= 60) { //
    return 1; //
  } else { //
    return 0; //
  }
};

// Helper function to determine Summary Attainment Level based on percentage of students achieved
const getSummaryAttainmentLevel = (percentageOfStudentsAchieved) => { //
  const numericPercentage = parseFloat(percentageOfStudentsAchieved); //
  if (isNaN(numericPercentage)) { //
    return ""; //
  }
  if (numericPercentage >= 70) { //
    return 3; //
  } else if (numericPercentage >= 60) { //
    return 2; //
  } else if (numericPercentage >= 50) { //
    return 1; //
  } else { //
    return 0; //
  }
};

// --- START: MODIFIED FUNCTION ---
// This function is updated to only find the lowest attainment level between CO4 and CO5.
const findLowestAttainmentCO = (attainmentLevelsSummary) => {
    const co4Level = attainmentLevelsSummary['CO4'];
    const co5Level = attainmentLevelsSummary['CO5'];
  
    const isCO4Valid = typeof co4Level === 'number' && !isNaN(co4Level);
    const isCO5Valid = typeof co5Level === 'number' && !isNaN(co5Level);
  
    if (isCO4Valid && isCO5Valid) {
      return co5Level < co4Level ? 'CO5' : 'CO4';
    } else if (isCO4Valid) {
      return 'CO4';
    } else if (isCO5Valid) {
      return 'CO5';
    }
    return null;
  };
// --- END: MODIFIED FUNCTION ---

function Test2({ onExport, onSendToBackend }) { //
  const location = useLocation(); //
  const navigate = useNavigate(); //
  const { convertedData } = location.state || {}; //

  const [summaryData, setSummaryData] = useState(null); //
  const [showRemedialView, setShowRemedialView] = useState(false); //
  const [remedialStudentList, setRemedialStudentList] = useState([]); //
  const [selectedRemedialCO, setSelectedRemedialCO] = useState("All"); //

  const targetCOPercent = 60; //

  useEffect(() => { //
    if (convertedData && convertedData.length > 0) { //
      calculateSummary(convertedData); //
    }
  }, [convertedData]); //

  useEffect(() => { //
    if (showRemedialView && convertedData && convertedData.length > 0) { //
      const students = identifyRemedialStudentsList(convertedData, targetCOPercent, selectedRemedialCO); //
      setRemedialStudentList(students); //
    } else if (!showRemedialView) { //
      setRemedialStudentList([]); //
    }
  }, [showRemedialView, convertedData, selectedRemedialCO, targetCOPercent]); //

  // --- START: MODIFIED FUNCTION ---
  // This function is updated to use the correct localStorage key.
  const calculateSummary = useCallback((data) => { //
    let totalStudentsPresentForPT2 = 0; //
    data.forEach(row => { //
      const ptMark = String(row["PT2"]).toLowerCase(); //
      if (ptMark !== "" && ptMark !== "ab" && ptMark !== "absent") { //
        totalStudentsPresentForPT2++; //
      }
    });

    const achievedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 }; //
    const totalAttendedCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 }; //
    const remedialCounts = { CO1: 0, CO2: 0, CO3: 0, CO4: 0, CO5: 0 }; //
    const calculatedAttainmentPercentages = {}; //

    data.forEach(row => { //
      const ptMark = String(row["PT2"]).toLowerCase(); //
      const isPresent = ptMark !== "" && ptMark !== "ab" && ptMark !== "absent"; //

      if (isPresent) { //
        ["CO1", "CO2", "CO3", "CO4", "CO5"].forEach(co => { //
          const marksAllocatedKey = `MARKS ALLOCATED ${co}`; //
          const attainmentPercentKey = `CO ATTAINMENT % ${co}`; //

          const marksAllocated = parseFloat(row[marksAllocatedKey]); //
          const attainmentPercent = parseFloat(row[attainmentPercentKey]); //

          if (!isNaN(marksAllocated) && marksAllocated > 0) { //
            totalAttendedCounts[co]++; //
            if (!isNaN(attainmentPercent)) { //
              if (attainmentPercent >= targetCOPercent) { //
                achievedCounts[co]++; //
              } else if (attainmentPercent < targetCOPercent) { //
                remedialCounts[co]++; //
              }
            } else { //
              remedialCounts[co]++; //
            }
          }
        });
      }
    });

    const attainmentLevelsSummary = {}; //
    for (const co in achievedCounts) { //
      if (totalAttendedCounts[co] > 0) { //
        const percentageOfStudentsAchievedForCO = ((achievedCounts[co] / totalAttendedCounts[co]) * 100); //
        calculatedAttainmentPercentages[co] = percentageOfStudentsAchievedForCO.toFixed(2); //
        attainmentLevelsSummary[co] = getSummaryAttainmentLevel(percentageOfStudentsAchievedForCO); //
      } else { //
        attainmentLevelsSummary[co] = ""; //
        calculatedAttainmentPercentages[co] = ""; //
      }
    }

    // Determine the lowest attainment CO and store it in localStorage
    const lowestCO = findLowestAttainmentCO(attainmentLevelsSummary); //
    if (lowestCO) { //
      // FIX: Use the correct localStorage key for Test 2 results
      localStorage.setItem('lowestTest2AttainmentCO', lowestCO);
    } else { //
      // FIX: Use the correct localStorage key for Test 2 results
      localStorage.removeItem('lowestTest2AttainmentCO');
    }

    const relevantCOs = ["CO1", "CO2", "CO3", "CO4", "CO5"]; //
    const totalAchievedStudentsAllCOs = relevantCOs.reduce((sum, co) => sum + (achievedCounts[co] || 0), 0); //
    const totalRelevantAttendedStudents = relevantCOs.reduce((sum, co) => sum + (totalAttendedCounts[co] || 0), 0); //
    const totalRemedialStudentsAllCOs = relevantCOs.reduce((sum, co) => sum + (remedialCounts[co] || 0), 0); //

    const overallAttainmentPercentage = totalRelevantAttendedStudents > 0 //
      ? ((totalAchievedStudentsAllCOs / totalRelevantAttendedStudents) * 100).toFixed(2) //
      : ""; //

    const overallAttainmentLevelSummary = totalRelevantAttendedStudents > 0 //
      ? getSummaryAttainmentLevel(overallAttainmentPercentage) //
      : ""; //

    setSummaryData({ //
      totalStudentsPresentForPT2, //
      achievedCounts, //
      attainmentLevels: attainmentLevelsSummary, //
      remedialCounts, //
      totalAchievedStudentsAllCOs, //
      overallAttainmentLevel: overallAttainmentLevelSummary, //
      totalRemedialStudentsAllCOs, //
      calculatedAttainmentPercentages, //
    });
  }, [targetCOPercent]); //
  // --- END: MODIFIED FUNCTION ---

  const handleBack = () => { //
    navigate(-1); //
  };

  // The rest of the component (handleExportExcel, handleExportRemedialExcel, JSX, etc.) remains unchanged.
  // ... (rest of the file content from the original Test2.js)
  const handleExportExcel = () => { //
    if (!summaryData || !convertedData || convertedData.length === 0) { //
      alert("No data or summary to export. Please ensure data is processed."); //
      return; //
    }

    const wb = XLSX.utils.book_new(); //
    const ws = {}; //
    const merges = []; //
    let currentRow = 0; //

    XLSX.utils.sheet_add_aoa(ws, [["CO Attainment Summary (PT2)"]], { origin: `A${currentRow + 1}` }); //
    merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 5 } }); //
    currentRow++; //

    XLSX.utils.sheet_add_aoa(ws, [["", "CO1", "CO2", "CO3", "CO4", "CO5"]], { origin: `A${currentRow + 1}` }); //
    currentRow++; //

    const row2Data = [ //
      "Total No. of Students appeared", //
      summaryData.totalStudentsPresentForPT2, null, null, null, null //
    ];
    XLSX.utils.sheet_add_aoa(ws, [row2Data], { origin: `A${currentRow + 1}` }); //
    merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 5 } }); //
    currentRow++; //

    const row3Data = [ //
      "No. of Students Achieved the Target CO%", //
      summaryData.achievedCounts.CO1, summaryData.achievedCounts.CO2, summaryData.achievedCounts.CO3, //
      summaryData.achievedCounts.CO4, summaryData.achievedCounts.CO5 //
    ];
    XLSX.utils.sheet_add_aoa(ws, [row3Data], { origin: `A${currentRow + 1}` }); //
    currentRow++; //

    const row4Data = [ //
      "Attainment Level", //
      summaryData.attainmentLevels.CO1, summaryData.attainmentLevels.CO2, summaryData.attainmentLevels.CO3, //
      summaryData.attainmentLevels.CO4, summaryData.attainmentLevels.CO5 //
    ];
    XLSX.utils.sheet_add_aoa(ws, [row4Data], { origin: `A${currentRow + 1}` }); //
    currentRow++; //

    const row5Data = [ //
      "Total No. of Students who need Remedial Class", //
      summaryData.remedialCounts.CO1, summaryData.remedialCounts.CO2, summaryData.remedialCounts.CO3, //
      summaryData.remedialCounts.CO4, summaryData.remedialCounts.CO5 //
    ];
    XLSX.utils.sheet_add_aoa(ws, [row5Data], { origin: `A${currentRow + 1}` }); //
    currentRow++; //

    XLSX.utils.sheet_add_aoa(ws, [[]], { origin: `A${currentRow + 1}` }); //
    currentRow++; //

    const mainHeaderStartRow = currentRow; //
    const mainDataHeaderRow1 = [ //
      "S.No", "Reg.No", "MARKS ALLOCATED", null, null, null, null, //
      "MARKS OBTAINED", null, null, null, null, "CO ATTAINMENT %", null, null, null, null, //
      "ATTAINMENT of COs", null, null, null, null, "PT2 Marks" //
    ];
    const mainDataHeaderRow2 = [ //
      null, null, "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", //
      "CO1", "CO2", "CO3", "CO4", "CO5", "CO1", "CO2", "CO3", "CO4", "CO5", null //
    ];
    XLSX.utils.sheet_add_aoa(ws, [mainDataHeaderRow1, mainDataHeaderRow2], { origin: `A${currentRow + 1}` }); //
    currentRow += 2; //

    const test2DataAsAoA = convertedData.map(row => [ //
      row["S.No"], //
      row["Reg.No"], //
      row["MARKS ALLOCATED CO1"], //
      row["MARKS ALLOCATED CO2"], //
      row["MARKS ALLOCATED CO3"], //
      row["MARKS ALLOCATED CO4"], //
      row["MARKS ALLOCATED CO5"], //
      row["MARKS OBTAINED CO1"], //
      row["MARKS OBTAINED CO2"], //
      row["MARKS OBTAINED CO3"], //
      row["MARKS OBTAINED CO4"], //
      row["MARKS OBTAINED CO5"], //
      row["CO ATTAINMENT % CO1"], //
      row["CO ATTAINMENT % CO2"], //
      row["CO ATTAINMENT % CO3"], //
      row["CO ATTAINMENT % CO4"], //
      row["CO ATTAINMENT % CO5"], //
      getIndividualAttainmentLevel(row["CO ATTAINMENT % CO1"]), //
      getIndividualAttainmentLevel(row["CO ATTAINMENT % CO2"]), //
      getIndividualAttainmentLevel(row["CO ATTAINMENT % CO3"]), //
      getIndividualAttainmentLevel(row["CO ATTAINMENT % CO4"]), //
      getIndividualAttainmentLevel(row["CO ATTAINMENT % CO5"]), //
      row["PT2"] //
    ]);
    XLSX.utils.sheet_add_aoa(ws, test2DataAsAoA, { origin: `A${currentRow + 1}` }); //

    merges.push({ s: { r: mainHeaderStartRow, c: 0 }, e: { r: mainHeaderStartRow + 1, c: 0 } }); //
    merges.push({ s: { r: mainHeaderStartRow, c: 1 }, e: { r: mainHeaderStartRow + 1, c: 1 } }); //
    merges.push({ s: { r: mainHeaderStartRow, c: 2 }, e: { r: mainHeaderStartRow, c: 6 } }); //
    merges.push({ s: { r: mainHeaderStartRow, c: 7 }, e: { r: mainHeaderStartRow, c: 11 } }); //
    merges.push({ s: { r: mainHeaderStartRow, c: 12 }, e: { r: mainHeaderStartRow, c: 16 } }); //
    merges.push({ s: { r: mainHeaderStartRow, c: 17 }, e: { r: mainHeaderStartRow, c: 21 } }); //
    merges.push({ s: { r: mainHeaderStartRow, c: 22 }, e: { r: mainHeaderStartRow + 1, c: 22 } }); //

    ws["!merges"] = merges; //
    ws["!cols"] = [ //
      { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, //
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, //
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, //
      { wch: 15 }, { wch: 10 } //
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Test2_Results_Summary"); //
    XLSX.writeFile(wb, "Test2_Results_Summary.xlsx"); //
  };

  const handleExportRemedialExcel = () => { //
    if (!remedialStudentList || remedialStudentList.length === 0) { //
      alert("No remedial students to export."); //
      return; //
    }

    const wb = XLSX.utils.book_new(); //
    const ws_name = "Remedial_Students"; //
    const ws_data = [ //
      ["Remedial Students List (Test 2)"], //
      [], //
      ["S.No", "Reg.No", "Name", "PT2 Marks", "CO Needing Remedial", "Attainment %", "Marks Allocated", "Marks Obtained"] //
    ];

    remedialStudentList.forEach((student, index) => { //
      const studentName = student["Name"] || ""; //
      student.remedialCOsDetails.forEach(coDetail => { //
        ws_data.push([ //
          index + 1, //
          student["Reg.No"], //
          studentName, //
          student["PT2"], //
          coDetail.coName, //
          coDetail.attainment, //
          coDetail.marksAllocated, //
          coDetail.marksObtained //
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data); //

    const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]; //

    ws['!cols'] = [ //
      { wch: 8 },  //
      { wch: 15 }, //
      { wch: 20 }, //
      { wch: 12 }, //
      { wch: 20 }, //
      { wch: 15 }, //
      { wch: 15 }, //
      { wch: 15 }  //
    ];

    ws['!merges'] = merges; //

    XLSX.utils.book_append_sheet(wb, ws, ws_name); //
    XLSX.writeFile(wb, "Test2_Remedial_Students.xlsx"); //
  };

   const handleSendToBackend = () => {
        if (convertedData && convertedData.length > 0) {
            const courseCode = "CS101"; // Example course code

            fetch(`http://localhost:8080/api/course/${courseCode}/test2`, {
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
                alert('Test 2 data saved to the backend successfully!');
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Failed to save Test 2 data to the backend.');
            });

        } else {
            alert("No data to send to backend.");
        }
    };

  const handleToggleRemedialView = () => { //
    setShowRemedialView(prev => !prev); //
  };

  return ( //
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Test 2 Results</h2> 

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

      {summaryData && !showRemedialView && (
        <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-gray-800">CO Attainment Summary (PT2)</h3>
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Total No. of Students appeared</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r" colSpan="5">{summaryData.totalStudentsPresentForPT2}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">No. of Students Achieved the Target CO%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO2}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO3}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.achievedCounts.CO4}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.achievedCounts.CO5}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Attainment Level</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO2}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO3}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.attainmentLevels.CO4}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.attainmentLevels.CO5}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">Total No. of Students who need Remedial Class</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO2}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO3}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 border-r">{summaryData.remedialCounts.CO4}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">{summaryData.remedialCounts.CO5}</td>
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
                <th rowSpan="2" className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-b-2">PT2 Marks</th>
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
                  <th key={`attainment-level-${co}`} className="px-3 py-2 text-center text-xs font-medium text-black-500 uppercase tracking-wider border-r">{co}</th>
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
                  <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO1"])}</td>
                  <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO2"])}</td>
                  <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO3"])}</td>
                  <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO4"])}</td>
                  <td className="px-3 py-2 border-r text-center text-gray-700">{getIndividualAttainmentLevel(row["CO ATTAINMENT % CO5"])}</td>
                  <td className="px-3 py-2 border-r text-center text-gray-700">{row["PT2"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 text-center text-red-500">
          No Test 2 data available. Please upload an Excel file and click "Test 2" from the Theory page.
        </div>
      )}
    </div>
  );
}

export default Test2;