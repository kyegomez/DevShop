# DevShop Frontend

A beautiful Apple-like frontend for the MultiApp Generator API, built with Next.js and Tailwind CSS.

## Features

- 🎨 Beautiful Apple-inspired design with glass morphism effects
- 📁 Drag & drop CSV file upload
- 🚀 Real-time app generation status monitoring
- 📱 Responsive design for all devices
- ⚡ Fast and modern UI with smooth animations
- 🔄 Automatic app starting with yarn install and yarn dev

## Getting Started

### Prerequisites

- Node.js 18+ 
- Yarn package manager
- The DevShop API running on localhost:8000

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Start the development server:
```bash
yarn dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Upload CSV**: Drag and drop a CSV file or click to browse
2. **Generate Apps**: Click "Generate Applications" to start the generation process
3. **Monitor Progress**: Watch real-time progress updates
4. **Start Apps**: Once generation is complete, click "Start All Apps" to launch the generated applications
5. **Access Apps**: Click "Open App" to view running applications in new tabs

## API Integration

The frontend communicates with the DevShop API running on localhost:8000:

- `POST /generate` - Start app generation from CSV
- `GET /tasks/{task_id}` - Get generation status
- `GET /artifacts` - List generated applications
- `POST /start-app` - Start a specific application

## Design Features

- **Glass Morphism**: Semi-transparent backgrounds with backdrop blur
- **Gradient Accents**: Beautiful blue-to-purple gradients
- **Smooth Animations**: Hover effects and transitions
- **Modern Typography**: Clean, readable fonts
- **Responsive Layout**: Works perfectly on all screen sizes

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **TypeScript**: Full type safety
- **State Management**: React hooks and local state

## Development

```bash
# Run development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start

# Run linting
yarn lint
```

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles and Tailwind
│   ├── layout.tsx       # Root layout component
│   └── page.tsx         # Main page component
└── components/          # Reusable components (future)
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
