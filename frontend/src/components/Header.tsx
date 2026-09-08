/**
 * Header component - Minimal application header
 */
interface HeaderProps {
  onCreateComplaint: () => void;
}

export default function Header({ onCreateComplaint }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center gap-3">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <h1 className="text-base sm:text-xl font-bold text-white truncate">Complaint Portal</h1>
          </div>
          
          {/* Button */}
          <button 
            onClick={onCreateComplaint} 
            className="bg-white text-purple-700 hover:bg-purple-50 px-3 sm:px-4 py-2 rounded-lg font-medium flex items-center gap-1 sm:gap-2 shadow-md transition-all hover:shadow-lg text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden xs:inline">Report Issue</span>
            <span className="xs:hidden">Report</span>
          </button>
        </div>
      </div>
    </header>
  );
}
