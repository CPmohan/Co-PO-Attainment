import React, { useEffect, useState } from "react";
import Button from "../../../compounds/button";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import BasicsTable from "../../../compounds/tables/basics";

function IPResults({ onExport, onSendToBackend }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { convertedData, originalExcelData } = location.state || {};

  const [displayData, setDisplayData] = useState([]);
  const [displayHeaders, setDisplayHeaders] = useState([]);
  const [tableFields, setTableFields] = useState([]);
  const [lowestTest1AttainmentCO, setLowestTest1AttainmentCO] = useState(null);
  const [lowestTest2AttainmentCO, setLowestTest2AttainmentCO] = useState(null);

  useEffect(() => {
    if (convertedData && convertedData.length > 0) {
      setDisplayData(convertedData);
      const headers = Object.keys(convertedData[0]);
      setDisplayHeaders(headers);
      setTableFields(headers);
    }

    const storedLowestTest1CO = localStorage.getItem('lowestTest1AttainmentCO');
    if (storedLowestTest1CO) {
        setLowestTest1AttainmentCO(storedLowestTest1CO);
        console.log("IPResults: Lowest Test 1 Attainment CO loaded:", storedLowestTest1CO);
    } else {
        console.log("IPResults: No lowest Test 1 Attainment CO found in localStorage. Defaulting IP1 mapping to CO2.");
        setLowestTest1AttainmentCO("CO2");
    }

    const storedLowestTest2CO = localStorage.getItem('lowestTest2AttainmentCO');
    if (storedLowestTest2CO) {
        setLowestTest2AttainmentCO(storedLowestTest2CO);
        console.log("IPResults: Lowest Test 2 Attainment CO loaded:", storedLowestTest2CO);
    } else {
        console.log("IPResults: No lowest Test 2 Attainment CO found in localStorage. Defaulting IP2 mapping to CO4.");
        setLowestTest2AttainmentCO("CO4");
    }
  }, [convertedData]);

  const handleBack = () => {
    navigate(-1);
  };

  const getAttainmentLevelFromPercentage = (percentage) => {
    const numericPercentage = parseFloat(percentage);
    if (isNaN(numericPercentage)) return "";
    if (numericPercentage >= 70) return "3";
    if (numericPercentage >= 60) return "2";
    if (numericPercentage >= 50) return "1";
    return "0";
  };

  const convertIP1COAttainmentData = (dataToConvert, dynamicIP1CO) => {
    const targetCO = dynamicIP1CO || "CO2";

    const transformed = dataToConvert.map((row) => {
      const sno = row["S.No"] || "";
      const regNo = row["Reg. No."] || "";
      const name = row["Name"] || "";
      const ip1Value = parseFloat(row["IP1"]) || 0;

      const newRow = {
        "S.No": sno,
        "Reg.No": regNo,
        "Name": name,
        "IP1 Marks": row["IP1"],
      };

      const allCOs = ["CO1", "CO2", "CO3", "CO4", "CO5"];
      const marksAllocatedForIP = 10;

      allCOs.forEach(co => {
        const marksAllocatedKey = `MARKS ALLOCATED ${co}`;
        const marksObtainedKey = `MARKS OBTAINED ${co}`;
        const attainmentPercentKey = `CO ATTAINMENT % ${co}`;
        const attainmentLevelKey = `ATTAINMENT of COs ${co}`;

        newRow[marksAllocatedKey] = 0;
        newRow[marksObtainedKey] = 0;
        newRow[attainmentPercentKey] = "";
        newRow[attainmentLevelKey] = "";

        if (co === targetCO) {
            newRow[marksAllocatedKey] = marksAllocatedForIP;
            newRow[marksObtainedKey] = ip1Value;
            if (marksAllocatedForIP > 0) {
                const attainment = (ip1Value / marksAllocatedForIP) * 100;
                newRow[attainmentPercentKey] = attainment.toFixed(2);
                newRow[attainmentLevelKey] = getAttainmentLevelFromPercentage(attainment);
            } else {
                newRow[attainmentPercentKey] = "";
                newRow[attainmentLevelKey] = "";
            }
        }
      });
      return newRow;
    });
    return transformed;
  };

  const convertIP2COAttainmentData = (dataToConvert, dynamicIP2CO) => {
    const targetCO = dynamicIP2CO || "CO4";

    const transformed = dataToConvert.map((row) => {
      const sno = row["S.No"] || "";
      const regNo = row["Reg. No."] || "";
      const name = row["Name"] || "";
      const ip2Value = parseFloat(row["IP2"]) || 0;

      const newRow = {
        "S.No": sno,
        "Reg.No": regNo,
        "Name": name,
        "IP2 Marks": row["IP2"],
      };

      const allCOs = ["CO1", "CO2", "CO3", "CO4", "CO5"];
      const marksAllocatedForIP = 10;

      allCOs.forEach(co => {
        const marksAllocatedKey = `MARKS ALLOCATED ${co}`;
        const marksObtainedKey = `MARKS OBTAINED ${co}`;
        const attainmentPercentKey = `CO ATTAINMENT % ${co}`;
        const attainmentLevelKey = `ATTAINMENT of COs ${co}`;

        newRow[marksAllocatedKey] = 0;
        newRow[marksObtainedKey] = 0;
        newRow[attainmentPercentKey] = "";
        newRow[attainmentLevelKey] = "";

        if (co === targetCO) {
            newRow[marksAllocatedKey] = marksAllocatedForIP;
            newRow[marksObtainedKey] = ip2Value;
            if (marksAllocatedForIP > 0) {
                const attainment = (ip2Value / marksAllocatedForIP) * 100;
                newRow[attainmentPercentKey] = attainment.toFixed(2);
                newRow[attainmentLevelKey] = getAttainmentLevelFromPercentage(attainment);
            } else {
                newRow[attainmentPercentKey] = "";
                newRow[attainmentLevelKey] = "";
            }
        }
      });
      return newRow;
    });
    return transformed;
  };

  const handleIP1COAttainmentClick = () => {
    if (displayData && displayData.length > 0) {
      const convertedIP1COData = convertIP1COAttainmentData(displayData, lowestTest1AttainmentCO);
      navigate("/ip1-co-attainment-results", { state: { convertedData: convertedIP1COData } });
    } else {
      alert("No data available to generate IP1 CO Attainment Report. Please upload an Excel file and process IP data.");
    }
  };

  const handleIP2COAttainmentClick = () => {
    if (displayData && displayData.length > 0) {
      const convertedIP2COData = convertIP2COAttainmentData(displayData, lowestTest2AttainmentCO);
      navigate("/ip2-co-attainment-results", { state: { convertedData: convertedIP2COData, lowestTest2AttainmentCO: lowestTest2AttainmentCO } });
    } else {
      alert("No data available to generate IP2 CO Attainment Report. Please upload an Excel file and process IP data.");
    }
  };

  // New function to transform data for the backend's IPResult struct
  const transformIPDataForBackend = (data) => {
    return data.map(row => {
      const transformedRow = {};
      for (const key in row) {
        if (Object.hasOwnProperty.call(row, key)) {
          // Standardize keys to match backend struct
          if (key === "Reg. No.") { // Assuming original key from Excel
            transformedRow["Reg.No"] = row[key];
          } else if (key === "IP (20)") { // Assuming original key from Excel for IPTotal
            transformedRow["IPTotal"] = row[key];
          } else {
            transformedRow[key] = row[key];
          }
        }
      }
      return transformedRow;
    });
  };

  const handleSendIPToBackend = () => {
    if (displayData && displayData.length > 0) {
      const dataToSend = transformIPDataForBackend(displayData);
      onSendToBackend(dataToSend, "uploadIP");
    } else {
      alert("No data available to send to backend.");
    }
  };

  if (!displayData || displayData.length === 0) {
    return (
      <div className="mt-6 text-center text-red-500">
        No Internal Performance (IP) data available. Please upload an Excel file and click "IP" from
        the Theory page.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mt-4 flex space-x-4">
        <Button
          label="Back"
          onClick={handleBack}
          others="bg-gray-500 hover:bg-gray-700"
        />
        <Button
          label="Export as Excel"
          onClick={() => onExport(displayData, "IP_Results")}
          others="bg-blue-500 hover:bg-blue-700"
        />
        <Button
          label="Send to Backend"
          onClick={handleSendIPToBackend} // Updated to use the new handler
          others="bg-green-500 hover:bg-green-700"
        />
        <Button
          label="IP1 CO Attainment"
          onClick={handleIP1COAttainmentClick}
          others="bg-gray-500 hover:bg-gray-700"
        />
        <Button
          label="IP2 CO Attainment"
          onClick={handleIP2COAttainmentClick}
          others="bg-gray-500 hover:bg-gray-700"
        />
      </div>
      <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">
        Internal Performance (IP) Data
      </h3>
      <h4 className="text-xl font-semibold mb-2 text-center text-gray-700">Detailed IP Scores</h4>
      <div className="overflow-x-auto mb-8 border border-gray-200 rounded-lg">
        <BasicsTable
          sno={false}
          header={displayHeaders}
          data={displayData}
          fields={tableFields}
        />
      </div>
    </div>
  );
}

export default IPResults;