# BeanBuilt AI beanbuiltai.com

A personalized fitness and nutrition planning application powered by AI.

## Features

- Personalized workout plans
- Customized nutrition plans
- Progress tracking
- AI-powered recommendations
- User authentication

## Tech Stack

- Next.js 14 (App Router)
- React
- TypeScript
- Prisma (PostgreSQL)
- OpenAI API
- NextAuth.js
- Tailwind CSS
- shadcn/ui

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Database
   DATABASE_URL="postgresql://user:"

   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
src/
├── app/              # App Router pages and API routes
├── components/       # React components
├── lib/             # Utility functions and configurations
├── types/           # TypeScript type definitions
└── styles/          # Global styles
```

## API Routes

- `/api/workouts` - Workout plan generation and management
- `/api/nutrition` - Nutrition plan generation and management
- `/api/progress` - Progress tracking and analysis

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 
<img width="1710" alt="Screenshot 2025-05-23 at 11 23 41 PM" src="https://github.com/user-attachments/assets/6662c24b-42ba-4fe9-916f-55493b75c473" />

<img width="1710" alt="Screenshot 2025-05-29 at 7 44 30 PM" src="https://github.com/user-attachments/assets/3218b47c-c191-4650-8d33-88ed3d95c5d9" />







