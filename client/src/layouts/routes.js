// routes.js
import { lazy } from "react";

// Theory Components
const Theory = lazy(() => import("../page/component/Theory/Theory"));
const Test1 = lazy(() => import("../page/component/Theory/Test1"));
const Test2 = lazy(() => import("../page/component/Theory/Test2"));
const IPResults = lazy(() => import("../page/component/Theory/IPResults"));
const IP1COAttainmentResults = lazy(() => import("../page/component/Theory/IP1COAttainmentResults"));
const IP2COAttainmentResults = lazy(() => import("../page/component/Theory/IP2COAttainmentResults"));

// Theory & Lab Components
const Theorylab = lazy(() => import("../page/component/Theory&lab/Theorylab"));
const Test1lab = lazy(() => import("../page/component/Theory&lab/Test1lab"));
const Test2lab = lazy(() => import("../page/component/Theory&lab/Test2lab"));
const IPResultslab = lazy(() => import("../page/component/Theory&lab/IPResultslab"));
const IP1COAttainmentResultslab = lazy(() => import("../page/component/Theory&lab/IP1COAttainmentResultslab"));
const IP2COAttainmentResultslab = lazy(() => import("../page/component/Theory&lab/IP2COAttainmentResultslab"));


const routes = {
  // Theory
  Theory,
  Test1,
  Test2,
  IPResults,
  IP1COAttainmentResults,
  IP2COAttainmentResults,
  
  // Theory & Lab
  Theorylab,
  Test1lab,
  Test2lab,
  IPResultslab,
  IP1COAttainmentResultslab,
  IP2COAttainmentResultslab,
};

export default routes;