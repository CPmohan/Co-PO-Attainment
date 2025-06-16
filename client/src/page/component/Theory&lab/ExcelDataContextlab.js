// src/context/ExcelDataContextlab.js
import React, { createContext, useState, useContext } from 'react';

// Create the context
const ExcelDataContextlab = createContext();

// Create a provider component - RENAMED
export const ExcelDataLabProvider = ({ children }) => {
  const [uploadedExcelData, setUploadedExcelData] = useState([]);
  const [uploadedHeaders, setUploadedHeaders] = useState([]);

  // This will store the *original* uploaded data and its headers for the lab section
  const setOriginalExcelData = (data, headers) => {
    setUploadedExcelData(data);
    setUploadedHeaders(headers);
  };

  return (
    <ExcelDataContextlab.Provider value={{ uploadedExcelData, uploadedHeaders, setOriginalExcelData }}>
      {children}
    </ExcelDataContextlab.Provider>
  );
};

// Custom hook to use the Excel Data context - RENAMED to be unique
export const useExcelDataLab = () => {
  return useContext(ExcelDataContextlab);
};