// import React from "react";

// const Footer: React.FC = () => {
//   return (
//     <footer className="border-t border-gray-200 bg-white">
//       <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-600">
//         <p>Cinema Booking Platform</p>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-white text-lg font-semibold">Cinema Booking</div>
          <div className="text-sm">
            © {new Date().getFullYear()} Cinema Booking. All rights reserved.
          </div>
        </div>

        <nav className="flex items-center gap-6">
          <Link to="/about" className="text-sm hover:text-white">
            About
          </Link>
          <Link to="/contact" className="text-sm hover:text-white">
            Contact
          </Link>
          <Link to="/terms" className="text-sm hover:text-white">
            Terms
          </Link>
        </nav>

        <div className="text-sm">Built with ♥</div>
      </div>
    </footer>
  );
};

export default Footer;
