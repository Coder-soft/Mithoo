# AI-Powered Markdown Editor
***This project is an example of powerful vibe coding apps power***
This is a modern, AI-enhanced markdown editor designed for a seamless and powerful writing experience. Built with a modern frontend stack, it integrates deeply with Supabase for backend services, authentication, and AI-powered features.

## ✨ Features

- **📝 WYSIWYG Markdown Editor**: A rich text editor powered by [BlockNote](https://www.blocknotejs.org/) that provides an intuitive, Notion-like editing experience.
- **🤖 AI Assistant**: An integrated chat assistant to help with writing, brainstorming, and research.
- **✍️ AI-Powered Content Tools**:
  - **Generate Articles**: Create entire articles from a title or outline.
  - **Improve Writing**: Enhance existing content for clarity, tone, and style.
  - **Humanize Text**: Adjust text to sound more natural with different modes (subtle, balanced, strong, stealth).
- **🔍 AI Research**: Conduct research on topics directly within the application, powered by Supabase AI.
- **📄 Article Management**: Easily create, open, and manage multiple articles in a tab-based interface.
- **🔒 User Authentication**: Secure user registration and login handled by Supabase Auth.
- **↔️ Diff Viewer**: Visually compare changes between different versions of your text before accepting AI edits.
- **🎨 Modern UI**: A sleek, responsive, and customizable user interface built with **shadcn/ui** and **Tailwind CSS**.

## 🚀 Tech Stack

- **Frontend**: [React](https://react.dev/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
- **UI Framework**: [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Editor**: [BlockNote](https://www.blocknotejs.org/)
- **Backend & Database**: [Supabase](https://supabase.com/)
- **AI Functions**: [Supabase Edge Functions](https://supabase.com/docs/functions)
- **Routing**: [React Router](https://reactrouter.com/)
- **Linting & Formatting**: ESLint

## ⚙️ Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Set Up Supabase

This project relies on Supabase for its backend.

1.  Go to [Supabase](https://supabase.com/) and create a new project.
2.  In your Supabase project dashboard, navigate to **Project Settings** > **API**.
3.  Find your **Project URL** and **anon (public) key**.
4.  Create a `.env` file in the root of your project and add your Supabase credentials:

    ```env
    VITE_SUPABASE_URL=YOUR_PROJECT_URL
    VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
    ```

5.  Set up the database schema by running the SQL scripts located in the `supabase/migrations` directory in the Supabase SQL Editor.
6.  Deploy the serverless functions located in `supabase/functions` using the Supabase CLI.

### 4. Run the Development Server

Once the setup is complete, you can start the development server:

```bash
npm run dev
```

The application should now be running at `http://localhost:5173`.

## 📂 Folder Structure

```
.
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks (useAuth, useAI, etc.)
│   ├── integrations/    # Third-party service integrations (Supabase)
│   ├── lib/             # Utility functions
│   ├── pages/           # Application pages (Home, Login)
│   ├── App.tsx          # Main app component with routing
│   └── main.tsx         # Entry point of the application
├── supabase/
│   ├── functions/       # Supabase Edge Functions for AI features
│   └── migrations/      # Database schema migrations
├── package.json         # Project dependencies and scripts
└── tailwind.config.ts   # Tailwind CSS configuration
```

---

This README provides a comprehensive overview for developers and contributors to understand, install, and run the application.

