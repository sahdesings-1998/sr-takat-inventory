import MemoList from "./pages/MemoList.jsx";
import MemoDetails from "./pages/MemoDetails.jsx";

const memoRoutes = [
  {
    path: "/memos",
    element: <MemoList />,
  },
  {
    path: "/memos/:id",
    element: <MemoDetails />,
  },
];

export default memoRoutes;
