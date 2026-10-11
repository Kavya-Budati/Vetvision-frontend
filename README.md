# Vetvision Frontend

Frontend client for **Vetvision** — Animal Healthcare and Veterinary Assistance Management System.

Built with **React 18** and **Vite**.

## Features

- **Pet Owner & Vet Portals**: Dashboards tailored for clinic staff, veterinarians, and animal owners.
- **Appointment Booking & Calendar**: Intuitive appointment management and real-time scheduling.
- **Medical Cases & Treatments**: Detailed animal case tracking, medical records, and status workflows.
- **Authentication**: JWT token handling, session persistence, and automatic logout on 401.

## Tech Stack

- **React 18**
- **Vite**
- **React Router DOM 6**
- **Axios**
- **Lucide React** (Icons)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Configuration options:
- `VITE_API_URL`: Backend API base URL (default: `http://localhost:8083/api`)

### Running Locally

```bash
npm run dev
```

The application will be available at `http://127.0.0.1:5173`.

### Production Build

```bash
npm run build
npm run preview
```
