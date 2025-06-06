import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="w-full py-4 px-6 bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link className="text-xl font-bold" href="/">
            ZapDev
          </Link>
          <div className="flex items-center space-x-4">
            <Link className="px-3 py-1.5 rounded-md hover:bg-slate-800" href="/auth-example">
              Auth Example
            </Link>
            <Link className="px-3 py-1.5 rounded-md hover:bg-slate-800" href="/chat">
              Chat
            </Link>
          </div>
        </div>
        <div></div>
      </div>
    </nav>
  );
}

export default Navbar; 