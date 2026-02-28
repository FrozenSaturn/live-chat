# Tars

A real-time chat application built with Next.js, Convex, and Clerk.

## Overview

Tars provides a modern, responsive chat interface with real-time data synchronization and robust authentication. Designed for speed and simplicity, it leverages a powerful modern web stack to deliver a seamless user experience.

## Tech Stack

- **Framework:** Next.js
- **Backend & Database:** Convex
- **Authentication:** Clerk
- **Styling:** Tailwind CSS, Radix UI, shadcn/ui

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed.

### Installation

1. Install project dependencies:

```bash
npm install
```

2. Set up your environment variables. You will need to configure keys for Clerk and Convex in a `.env.local` file at the root of the project.

### Development

Start the development server. This project uses a custom script to launch both the Next.js frontend and Convex backend concurrently.

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Deployment

This application is optimized for deployment on Vercel. 

Ensure you configure all necessary environment variables in your Vercel project settings for both Clerk integration and your production Convex deployment.
