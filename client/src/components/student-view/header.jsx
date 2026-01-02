import { GraduationCap, TvMinimalPlay } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useContext } from "react";
import { AuthContext } from "@/context/auth-context";
// Import your logo here
import ShieldLogo from "@/assets/logo.png";
function StudentViewCommonHeader() {
  const navigate = useNavigate();
  const { resetCredentials } = useContext(AuthContext);

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
  }

  return (
    <header className="flex items-center justify-between p-4 border-b relative">
      <div className="flex items-center space-x-4">
        <Link to="/home" className="flex items-center hover:text-black">
          {/* <GraduationCap className="h-8 w-8 mr-4 " /> */}
          <img
            src={ShieldLogo}
            alt="SurkshaShield Logo"
            className="h-10 w-10 mr-4 object-contain"
          />
          <span className="font-extrabold md:text-xl text-[14px]">
            SurkshaShield
          </span>
        </Link>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            onClick={() => {
              location.pathname.includes("/courses")
                ? null
                : navigate("/courses");
            }}
            className="text-[14px] md:text-[16px] font-medium"
          >
            Explore Courses
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              location.pathname.includes("/community-articles")
                ? null
                : navigate("/community-articles");
            }}
            className="text-[14px] md:text-[16px] font-medium"
          >
            Articles
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              location.pathname.includes("/coming-soon")
                ? null
                : navigate("/coming-soon");
            }}
            className="text-[14px] md:text-[16px] font-medium"
          >
            Activities
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              location.pathname.includes("/coming-soon")
                ? null
                : navigate("/coming-soon");
            }}
            className="text-[14px] md:text-[16px] font-medium"
          >
            Need Help?
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex gap-4 items-center">
          <div
            onClick={() => navigate("/student-courses")}
            className="flex cursor-pointer items-center gap-3"
          >
            <span className="font-extrabold md:text-xl text-[14px]">
              My Courses
            </span>
            <TvMinimalPlay className="w-8 h-8 cursor-pointer" />
          </div>
          <Button onClick={handleLogout}>Sign Out</Button>
        </div>
      </div>
    </header>
  );
}

export default StudentViewCommonHeader;
