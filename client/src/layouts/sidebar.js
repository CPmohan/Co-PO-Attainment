import { useNavigate } from "react-router-dom";
import Logo from "../assets/img/logo.png";
import { useState } from "react";
import { Settings, User, Menu, X } from "lucide-react";
import IconButton from "../compounds/iconButton";

function AppSidebar(props) {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  return (
    <div
      className={`h-screen bg-secondary text-white ${isOpen ? "w-30" : "w-20"
        } transition-all duration-300 p-4`}
    >
      {/* Sidebar Toggle Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="mb-4">
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Logo */}
      <div className="flex justify-center mb-6">
        <img width={40} src={Logo} alt="logo" />
      </div>

      {/* Navigation */}
      <nav>
        <ul className="space-y-5">
          <li>
            <IconButton
              onClick={() => navigate("/theory")}
              icon="bx-book"
              label={isOpen ? "Theory" : ""}
            />
          </li>
          <li>
            <IconButton
              onClick={() => navigate("/theorylab")}
              icon="bx-test-tube"
              label={isOpen ? "Theory + Lab" : ""}
            />
          </li>
        </ul>
        <li>
          <IconButton
            onClick={() => navigate("/settings")}
            icon="bx-cog"
            label={isOpen ? "Settings" : ""}
          />
        </li>
        <li>
          <IconButton
            onClick={() => navigate("/profile")}
            icon="bx-user"
            label={isOpen ? "Profile" : ""}
          />
        </li>
      </nav>
    </div>
  );
}

export default AppSidebar;