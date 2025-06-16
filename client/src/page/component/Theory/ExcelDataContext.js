// src/context/ExcelDataContext.js
import React, { createContext, useState, useContext } from 'react';

// Create the context
const ExcelDataContext = createContext();

// Create a provider component
export const ExcelDataProvider = ({ children }) => {
  const [uploadedExcelData, setUploadedExcelData] = useState([]);
  const [uploadedHeaders, setUploadedHeaders] = useState([]);

  // This will store the *original* uploaded data and its headers
  const setOriginalExcelData = (data, headers) => {
    setUploadedExcelData(data);
    setUploadedHeaders(headers);
  };

  return (
    <ExcelDataContext.Provider value={{ uploadedExcelData, uploadedHeaders, setOriginalExcelData }}>
      {children}
    </ExcelDataContext.Provider>
  );
};

// Custom hook to use the Excel Data context
export const useExcelData = () => {
  return useContext(ExcelDataContext);
};