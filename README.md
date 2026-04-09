# 🦷 DentalCare - Multi-tenant Medical Platform

![DentalCare Banner](https://img.shields.io/badge/DentalCare-Premium-blue?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Development-orange?style=for-the-badge)

**DentalCare** is a robust, multi-tenant medical appointment and CLINIC management platform designed for dentists, psychologists, and general practitioners. It offers a comprehensive solution for managing multiple clinics, patient records, and financial operations in one place.

---

## ✨ Key Features

- 🏢 **Multi-tenant Architecture**: Isolated data for different organizations and clinics.
- 🔐 **Role-Based Access Control (RBAC)**:
  - **SuperAdmin**: System-wide management and organization approval.
  - **Owner**: Full control over their organization and clinics.
  - **Doctor**: Access to patient medical records and appointments.
  - **Receptionist**: Management of scheduling and patient check-in.
- 📅 **Advanced Scheduling**: Interactive calendar with FullCalendar for managing appointments across clinics.
- 📋 **Digital Medical Records**:
  - Secure patient history management.
  - **Odontograms**: Interactive dental charts for detailed tracking.
  - Digital signatures for prescriptions and records.
- 💰 **Financial Management**:
  - Income and expense tracking.
  - Billing and payment history.
  - Detailed financial dashboards for clinic owners.
- 📱 **WhatsApp Integration**: Automated appointment reminders via Meta Cloud API.

---

## 🚀 Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, FullCalendar.
- **Backend**: Node.js, Express.js.
- **Database & ORM**: PostgreSQL, Prisma ORM.
- **Deployment**: Docker & Docker Compose.
- **Security**: JWT Authentication, Bcrypt password hashing, Helmet security headers.

---

## 🛠️ Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/) (if running locally without Docker)

### Running with Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/DentalCare.git
   cd DentalCare
   ```

2. Start the services:
   ```bash
   docker-compose up -d
   ```

3. The application will be available at:
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`

---

## ⚙️ Configuration

### Backend Environment Variables (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API Port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret for access tokens | - |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | - |

---

## 📂 Project Structure

```text
DentalCare/
├── backend/            # Express API with Prisma
│   ├── src/            # Source code (Services, Controllers, Routers)
│   ├── prisma/         # Database schema and migrations
│   └── Dockerfile
├── frontend/           # React Application
│   ├── src/            # Source code (Components, Pages, Hooks)
│   └── Dockerfile
└── docker-compose.yml  # Root orchestration
```

---

## 🤝 Contributing

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Developed with ❤️ for the medical community.*
