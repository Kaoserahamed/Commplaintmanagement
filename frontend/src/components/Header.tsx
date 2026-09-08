/**
 * Header component - Application header
 */
interface HeaderProps {
  onCreateComplaint: () => void;
}

export default function Header({ onCreateComplaint }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg border-b border-primary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2">
              <svg className="w-8 h-8 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Complaint Management System</h1>
              <p className="text-sm text-primary-100 mt-1">Report and track public issues</p>
            </div>
          </div>
          <button onClick={onCreateComplaint} className="bg-white text-primary-700 hover:bg-primary-50 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all hover:shadow-xl">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Report Issue
          </button>
        </div>
      </div>
    </header>
  );
}
