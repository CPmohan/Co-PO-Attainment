import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import AppSidebar from "./sidebar";
import { Suspense, useState, useCallback } from "react";
import routes from "./routes";
import BorderLinearProgress from "compounds/progress";
import * as XLSX from "xlsx";

// Import both context providers
import { ExcelDataProvider } from '../page/component/Theory/ExcelDataContext';
import { ExcelDataLabProvider } from '../page/component/Theory&lab/ExcelDataContextlab';

// This is the main content area of your application
function AppContent() {
  // The logic for exporting to Excel and posting data.
  // These functions are passed down as props to the relevant result pages.
  const exportToExcel = useCallback((data, reportType = "DefaultReport") => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, `${reportType}_Report.xlsx`);
      console.log("Export successful!");
    } catch (error) {
      console.error("Failed to export to Excel:", error);
    }
  }, []);

  const postConvertedData = useCallback(async (data, endpoint) => {
    if (!endpoint) {
        console.error("Endpoint is not defined for postConvertedData.");
        return;
    }
    try {
      const response = await fetch(`http://your-backend-api.com/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('Data successfully sent to backend:', result);
    } catch (error) {
      console.error('Error sending data to backend:', error);
    }
  }, []);

  // Complete menu structure for navigation and routing
  const menus = [
    // Theory Section
    { element: "Theory", 
      path: "/theory", 
      id: 1, icon: "bx-book", 
      name: "Theory", 
      menu: true },
    { element: "Test1", path: "/test1-results", id: 2, menu: false },
    { element: "Test2", path: "/test2-results", id: 3, menu: false },
    { element: "IPResults", path: "/ip-results", id: 4, menu: false },
    { element: "IP1COAttainmentResults", path: "/ip1-co-attainment-results", id: 5, menu: false },
    { element: "IP2COAttainmentResults", path: "/ip2-co-attainment-results", id: 6, menu: false },

    // Theory & Lab Section
    { element: "Theorylab", path: "/theorylab", id: 7, icon: "bx-flask", name: "Theory & Lab", menu: true },
    { element: "Test1lab", path: "/test1-lab-results", id: 8, menu: false },
    { element: "Test2lab", path: "/test2-lab-results", id: 9, menu: false },
    { element: "IPResultslab", path: "/ip-lab-results", id: 10, menu: false },
    { element: "IP1COAttainmentResultslab", path: "/ip1-lab-attainment-results", id: 11, menu: false },
    { element: "IP2COAttainmentResultslab", path: "/ip2-lab-attainment-results", id: 12, menu: false },
  ];

  // A list to identify which pages should receive the handler props
  const pagesNeedingHandlers = [
    "Test1", "Test2", "IPResults", "IP1COAttainmentResults", "IP2COAttainmentResults",
    "Test1lab", "Test2lab", "IPResultslab", "IP1COAttainmentResultslab", "IP2COAttainmentResultslab"
  ];

  return (
    <div className="w-screen h-screen flex">
      {/* Your sidebar component */}
      <AppSidebar />

      <div className="flex-1 flex flex-col h-screen w-full overflow-auto">
        <div className="w-full bg-white p-3 h-18 flex items-center justify-between drop-shadow-sm z-50">
          <div className="flex gap-5 items-center">
            <h3 className="font-medium text-lg">PS Portal</h3>
          </div>
        </div>

        <div className="flex-1 w-full overflow-auto ">
          <Suspense
            fallback={
              <div style={{ width: "100%", marginTop: -7 }}>
                <BorderLinearProgress />
              </div>
            }
          >
            <Routes>
              {/* Default route redirects to the main theory page */}
              <Route path="/" element={<Navigate to="/theory" replace />} />

              {menus.map((menu) => {
                const Component = routes[menu.element];
                if (!Component) {
                    // This log helps you find issues if a component isn't correctly listed in routes.js
                    console.error(`Component for route element '${menu.element}' not found in routes.js.`);
                    return null;
                }

                // If the component is a results page, pass the handler props
                if (pagesNeedingHandlers.includes(menu.element)) {
                  return (
                    <Route
                      key={menu.id}
                      path={menu.path}
                      element={<Component onExport={exportToExcel} onSendToBackend={postConvertedData} />}
                    />
                  );
                }
                
                // Otherwise, render it without the extra props
                return (
                  <Route
                    key={menu.id}
                    path={menu.path}
                    element={<Component />}
                  />
                );
              })}

              {/* A fallback route for any path that doesn't match */}
              <Route
                path="*"
                element={<h1 className="p-3 text-xl text-center">Page Not Found (404)</h1>}
              />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// The root App component that sets up the router and context providers
function App() {
  return (
    <Router>
      {/* Nest the providers so that all components in AppContent can access EITHER context.
        A component will choose which context to use based on the hook it imports:
        - `useExcelData()` for theory data.
        - `useExcelDataLab()` for theory & lab data.
      */}
      <ExcelDataProvider>
        <ExcelDataLabProvider>
          <AppContent />
        </ExcelDataLabProvider>
      </ExcelDataProvider>
    </Router>
  );
}

export default App;