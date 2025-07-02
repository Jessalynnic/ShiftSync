export default function DashboardFooter() {
  return (
    <footer className="w-full bg-gradient-to-br from-blue-100 via-blue-50 to-white border-t border-blue-100 py-6 flex justify-center items-center">
      <svg
        width="32"
        height="32"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="20" cy="20" r="18" fill="#38bdf8" />
        <path
          d="M13 20a7 7 0 0 1 7-7c2.5 0 4.7 1.36 5.89 3.39"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M27 20a7 7 0 0 1-7 7c-2.5 0-4.7-1.36-5.89-3.39"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="3" fill="#fff" />
      </svg>
      <span className="text-blue-400 text-sm ml-2">
        &copy; {new Date().getFullYear()} ShiftSync. All rights reserved.
      </span>
    </footer>
  );
}
