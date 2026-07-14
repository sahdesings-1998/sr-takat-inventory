import { lazy } from "react";

const CertificateList = lazy(() => import("./pages/CertificateList"));

const routes = [
  {
    path: "/certificates",
    element: <CertificateList />,
  },
];

export default routes;
