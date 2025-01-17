# NFT Generation Server

A full-stack NFT generation and management platform built with Express.js, React, and Solana integration.

## 🚀 Features

- Automated NFT image generation using HuggingFace API
- Solana blockchain integration for NFT minting and management
- Supabase integration for storage and database
- Real-time metadata updates and image processing
- React-based frontend with modern UI components (Radix UI)
- Secure authentication with Passport.js
- WebSocket support for real-time updates
- Database management with Drizzle ORM

## 📋 Prerequisites

- Node.js (v16 or higher)
- TypeScript
- PostgreSQL database
- Solana wallet and RPC endpoint
- HuggingFace API key
- Supabase account and project

## 🛠️ Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Required environment variables:

```env
SOLANA_RPC_URL=''           # Solana RPC endpoint
HF_API_KEY=''              # HuggingFace API key
DATABASE_URL=''            # PostgreSQL connection URL
SUPABASE_URL=''           # Supabase project URL
SUPABASE_KEY=''           # Supabase project key
SOLANA_COLLECTION_ID=''    # Solana NFT collection ID
SOLANA_PRIVATE_KEY=''     # Solana wallet private key
SUPABASE_BUCKET=''        # Supabase storage bucket name
```

## 🏗️ Project Structure

```
├── client/                # React frontend
│   └── src/
│       ├── App.tsx       # Main application component
│       └── index.css     # Global styles
├── server/
│   ├── lib/
│   │   ├── imageGen.ts   # HuggingFace image generation
│   │   ├── supabase.ts   # Supabase client setup
│   │   ├── uploadImage.ts # Image upload handling
│   │   └── promptManager.ts # AI prompt management
│   ├── routes.ts         # API routes
│   └── index.ts         # Server entry point
├── db/
│   ├── schema.ts        # Drizzle ORM schema
│   └── index.ts         # Database setup
└── drizzle.config.ts    # Drizzle configuration
```

## 🚦 Getting Started

1. Start the development server:

```bash
npm run dev
```

2. Build for production:

```bash
npm run build
```

3. Start production server:

```bash
npm start
```

## 💾 Database Management

This project uses Drizzle ORM for database operations. To update your database schema:

```bash
npm run db:push
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the repository.
