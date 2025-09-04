# FinPay - A FinTech Solution

FinPay is a comprehensive **FinTech backend application** built with **Node.js (Express.js)** and **MySQL**, deployed on **Vercel**.  
It provides APIs for managing invoices, wallets, transactions, virtual cards, currency conversion, and user profiles — delivering a complete financial management platform.

---

## 🚀 Features

### User Management
- Register, login, logout with JWT authentication
- Password reset via email
- Profile management (update name, address, contact details)
- Two-Factor Authentication (2FA)
- KYC verification process

### Invoices
- Create new invoices with amount, currency, due date, and description
- View invoices by status: draft, pending, due, overdue
- Search and filter invoices
- Delete invoices

### Virtual Cards
- Generate new virtual cards with spending limits
- Retrieve card details
- Delete virtual cards

### Wallets
- Retrieve balances in multiple currencies
- Fund wallet via bank transfer or credit card
- Withdraw funds to external accounts
- Convert currencies in real time
- Retrieve/export account statements (PDF/CSV)
- Track total income and expenses

### Transactions
- View all transactions (payments, conversions, receipts)
- Search, filter, and paginate transactions
- Retrieve specific transaction details
- Delete transactions

### Profile & Beneficiaries
- View and update user profile
- Add and manage beneficiaries
- Search beneficiaries
- Delete beneficiaries

### Notifications & Security
- Real-time notifications for payments and account activity
- Role-based access control (admin, user, guest)
- Input validation & rate limiting
- Data encryption (in transit & at rest)

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Cache**: Redis (for sessions & exchange rates)
- **Deployment**: Vercel
- **API Docs**: Swagger / Postman
- **Payment Gateway**: Stripe / PayPal
- **Currency Conversion**: OpenExchangeRates API

---

## 📂 Project Structure (example)

finpay-backend-farouq/
│── src/
│ ├── config/ # DB, Redis, API keys, etc.
│ ├── controllers/ # Business logic
│ ├── models/ # MySQL models
│ ├── routes/ # Express routes
│ ├── middlewares/ # Auth, validation, error handling
│ └── utils/ # Helpers (email, notifications, etc.)
│── tests/ # Unit & integration tests
│── .env.example # Environment variables
│── package.json
│── README.md


---

## ⚡ API Endpoints (Sample)

### Authentication
- `POST /signup` → Register new user
- `POST /login` → Login user
- `POST /logout` → Logout user
- `POST /forgot-password` → Reset password

### Invoices
- `POST /invoices` → Create invoice
- `GET /invoices` → Get all invoices
- `GET /invoices/:id` → Get single invoice
- `DELETE /invoices/:id` → Delete invoice

### Wallets
- `GET /wallets/balances` → Get balances
- `POST /wallets/fund` → Fund wallet
- `POST /wallets/withdraw` → Withdraw funds
- `POST /wallets/convert` → Convert currencies

---

## 🔒 Security
- JWT-based authentication
- Role-based access control
- Input validation & sanitization
- Encrypted storage of sensitive data
- API rate limiting

---

## 📦 Installation & Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/kunmifab/finpay-backend-farouq.git
   cd finpay-backend-farouq

2. Install dependencies:
    ```bash
    npm install

3. Setup .env file:
    ```bash
    DATABASE_URL="mysql://root@127.0.0.1:3306/finpay"
    NODE_ENV=development
    PORT=5000
    JWT_SECRET=finpayjwtsecret

4. Run migrations & seed data
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init

5. Start the server
    ```bash
    npm run dev #local
    npm start #prod



## 🤝 Contributing

Contributions are welcome!
Fork the repo, make your changes, and submit a PR.

## License

This project is licensed under the MIT License.
