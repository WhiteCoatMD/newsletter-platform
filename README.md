# Newsletter Platform

A comprehensive newsletter platform with features similar to Beehiiv, including content creation, audience growth, monetization, and analytics.

## Features

### Content Creation
- ✅ Intuitive editor with rich formatting
- ✅ Template system and custom designs
- ✅ Built-in website builder
- ✅ AI-powered content generation
- ✅ Audio newsletter support
- ✅ RSS to email functionality

### Audience Growth
- ✅ Referral program system
- ✅ Recommendation network
- ✅ Subscriber segmentation
- ✅ Customizable subscribe forms
- ✅ Magic links for social sharing

### Monetization
- ✅ Paid subscription tiers
- ✅ Ad network integration
- ✅ Sponsorship management
- ✅ Paywall functionality

### Analytics
- ✅ Campaign analytics dashboard
- ✅ A/B testing capabilities
- ✅ Subscriber insights and tracking

## Tech Stack

### Backend
- Node.js with TypeScript
- Express.js
- MongoDB with Mongoose
- JWT authentication
- Stripe for payments
- Nodemailer for email sending
- OpenAI for AI features

### Frontend
- React 18 with TypeScript
- Vite for building
- TailwindCSS for styling
- React Query for data management
- React Hook Form for forms
- Recharts for analytics

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Stripe account (for payments)
- OpenAI API key (for AI features)

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install backend dependencies:
```bash
cd backend && npm install
```

3. Install frontend dependencies:
```bash
cd frontend && npm install
```

4. Set up environment variables:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

5. Start development servers:
```bash
npm run dev
```

This will start both backend (port 5000) and frontend (port 3000) servers.

## Commands

- `npm run dev` - Start both backend and frontend in development mode
- `npm run build` - Build both backend and frontend for production
- `npm run test` - Run tests for both backend and frontend
- `npm run lint` - Run linting for both projects
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── utils/        # Utility functions
│   │   └── config/       # Configuration
├── frontend/          # React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   └── types/        # TypeScript types
├── shared/            # Shared types and utilities
└── docs/              # Documentation
```