import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export default function ClerkDemoPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Clerk Authentication Demo
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Experience seamless authentication with Clerk
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 space-y-6">
          <SignedOut>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Welcome! Please sign in
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Get started by creating an account or signing in to your existing account.
              </p>
              <div className="flex gap-4 flex-wrap">
                <SignInButton mode="modal">
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Welcome back! 👋
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                You are successfully signed in with Clerk.
              </p>
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <UserButton afterSignOutUrl="/clerk-demo" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Click your profile to manage your account
                </span>
              </div>
            </div>
          </SignedIn>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 space-y-4">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Features Demonstrated:
          </h3>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>SignInButton</strong> - Opens sign-in modal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>SignUpButton</strong> - Opens sign-up modal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>UserButton</strong> - Displays user profile and sign-out option</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <span><strong>SignedIn/SignedOut</strong> - Conditional rendering based on auth state</span>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
