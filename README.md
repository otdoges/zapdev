# Animated AI Chat

Welcome to Animated AI Chat! This is a web application that provides an engaging and interactive chat experience powered by various AI models through OpenRouter, featuring smooth animations and user authentication.

## Features

*   **AI-Powered Chat:** Interact with a selection of cutting-edge AI models.
*   **User Authentication:** Secure sign-up and sign-in functionality using Clerk.
*   **Animated Interface:** Smooth and responsive UI animations using Framer Motion.
*   **Multiple AI Models:** Leverages OpenRouter to potentially connect to different large language models.
*   **Analytics:** Integrated with PostHog for usage analytics.
*   **Database (Optional):** Configured to potentially use Supabase for data persistence.

## Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/)
*   **AI SDK:** [Vercel AI SDK](https://sdk.vercel.ai/)
*   **AI Model Provider:** [OpenRouter](https://openrouter.ai/)
*   **Authentication:** [Clerk](https://clerk.com/)
*   **Animation:** [Framer Motion](https://www.framer.com/motion/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Assumed, common with Next.js projects)
*   **Database (Optional):** [Supabase](https://supabase.com/)
*   **Analytics:** [PostHog](https://posthog.com/)
*   **Package Manager:** [Bun](https://bun.sh/)

## Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [Bun](https://bun.sh/) (Package manager)

## Getting Started

Follow these steps to get the project up and running on your local machine:

1.  **Clone the repository:**
    ```bash
    git clone <https://github.com/otdoges/zapdev.git>
    cd zapdev
    ```

2.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Then, fill in the required API keys and URLs in the `.env` file. See the [Environment Variables](#environment-variables) section below for details.

3.  **Install dependencies:**
    ```bash
    bun install
    ```

4.  **Run the development server:**
    ```bash
    bun dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

You'll need to set the following environment variables in your `.env` file:

*   `NEXT_OPENROUTER_API_KEY`: Your API key from [OpenRouter](https://openrouter.ai/).
*   `NEXT_PUBLIC_POSTHOG_KEY`: Your project API key from [PostHog](https://posthog.com/).
*   `NEXT_PUBLIC_POSTHOG_HOST`: The API host for your PostHog instance (e.g., `https://app.posthog.com`).
*   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your publishable key from your [Clerk](https://clerk.com/) application dashboard.
*   `CLERK_SECRET_KEY`: Your secret key from your [Clerk](https://clerk.com/) application dashboard.
*   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (if using Supabase).
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project anonymous key (if using Supabase).

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
