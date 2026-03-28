# Habit Tracker

A modern habit tracking application built with a sleek neomorphic design. Focus on consistency and organization while enjoying a beautiful, minimalist user interface.

## Tech Stack

- Frontend Framework: Next.js (App Router)
- Language: TypeScript
- Styling: Tailwind CSS v4 (Custom Neomorphic Theme)
- Database: SQLite (via Prisma ORM)
- Authentication: Custom JWT sessions with Jose and bcryptjs

## Features

- User Authentication: Secure sign up, login, and customized session handling.
- Habit Management: Create personalized daily or weekly habits.
- Daily Tracking: Check off your routines dynamically with a single click.
- Progress Visualization: Aesthetic neomorphic components indicating completion status.
- PWA Support: Installable as a Progressive Web App on mobile and desktop devices.

## Local Development

1. Clone the repository and install dependencies
```bash
npm install
```

2. Generate the Prisma Client and configure the local SQLite database
```bash
npx prisma db push
npx prisma generate
```

3. Start the development server
```bash
npm run dev
```

4. Open `http://localhost:3000` in your browser.

## Architecture

This application operates using Next.js Server Actions to securely execute database mutations without exposing traditional APIs. Context and state are managed on the server, paired with neomorphic utility components built using React and Tailwind CSS.