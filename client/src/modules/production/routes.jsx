import JobCardList from "./pages/JobCardList.jsx";
import JobCardDetails from "./pages/JobCardDetails.jsx";

const productionRoutes = [
  {
    path: "/production",
    element: <JobCardList />,
  },
  {
    path: "/production/:id",
    element: <JobCardDetails />,
  },
];

export default productionRoutes;
