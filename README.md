# Techwave Enterprises – Invoice & Quotation Management System

A modernized, modular full-stack invoice and quotation management system built with **Node.js, Express, and MongoDB**.

---

## 📁 Project Architecture & Separation

The project has been separated from a single monolithic file into a clean, modular architecture:

```
inv-gen/
├── config/
│   └── db.js                 # MongoDB connection handler
├── models/
│   ├── User.js               # Login credentials Schema & Model (plain-text credentials)
│   └── Invoice.js            # Comprehensive Bill / Invoice / Quotation Schema & Model
├── db/
│   └── operations.js         # Single unified database operations module (CRUD & Auth)
├── routes/
│   ├── authRoutes.js         # Authentication endpoints (/api/auth)
│   └── invoiceRoutes.js      # Invoice & Quotation endpoints (/api/invoices)
├── public/                   # Frontend assets
│   ├── index.html            # Landing Page -> Dedicated Login Page
│   ├── invoice.html          # Bill & Invoice Generator (accessible after login)
│   ├── css/
│   │   ├── login.css         # Separated styling for Login Page
│   │   └── style.css         # Separated styling for Bill Generator & Print Sheet
│   └── js/
│       ├── login.js          # Separated JavaScript for Login & Auth handling
│       └── app.js            # Separated JavaScript for Invoice Generator & MongoDB sync
├── server.js                 # Express server & static asset dispatcher
├── seedUser.js               # Helper CLI script to seed/insert credentials
├── .env                      # Environment variables & MongoDB URI
├── .env.example              # Sample environment template
└── package.json              # Project dependencies and startup scripts
```

---

## 🔑 MongoDB Database Setup

The application connects to MongoDB Atlas using your connection string:
```
mongodb+srv://goremayur408_db_user:<db_password>@cluster0.xztxgey.mongodb.net/techwave_invoice?retryWrites=true&w=majority
```

### Steps to configure:
1. Open `.env` file in the project root.
2. Replace `<db_password>` with your actual MongoDB Atlas database user password.
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://goremayur408_db_user:YOUR_ACTUAL_PASSWORD@cluster0.xztxgey.mongodb.net/techwave_invoice?retryWrites=true&w=majority
   ```
3. Save the `.env` file.

---

## 👤 User Login & Credentials Schema

Per your specification:
> *"dont add any incepretion we'll add the id and pass by our self into the database directly"*

The **User** schema stores `username` (or `id`) and `password` (or `pass`) in **plain text** without encryption or hashing.

### User Schema (`models/User.js`):
- `username`: String (required, unique)
- `id`: String (alias for username)
- `password`: String (required, plain text)
- `pass`: String (alias for password)
- `name`: String (default: 'Administrator')
- `role`: String (default: 'admin')
- `createdAt`: Date

### Adding Credentials directly to MongoDB:
You can insert documents directly into the `users` collection via **MongoDB Compass**, **mongosh**, or **Atlas UI**:
```json
{
  "username": "admin",
  "password": "mysecretpassword",
  "name": "Mayur Gore",
  "role": "admin"
}
```
*(Both `{ username, password }` and `{ id, pass }` fields are supported)*

### Or using the CLI helper:
```bash
node seedUser.js admin mysecretpassword
```

---

## 🧾 Bill Structure & Schema Analysis

The **Invoice** schema (`models/Invoice.js`) models the complete bill structure:

### 1. Document Header & Identification
- `docType`: `'invoice'` (Tax Invoice) or `'quotation'` (Quotation)
- `invNo`: Serial Number (e.g., `001/2026-27` or `QT-001/2026-27`)

### 2. Company / Vendor Details
- `company.name`: `'Techwave Enterprises'`
- `company.address`: Office / Shop address
- `company.phone`, `company.email`, `company.gstin` (`27AAFPY8345R1ZJ`)
- `company.state` (`Maharashtra`), `company.stateCode` (`27`)
- `company.bank`: Bank account number, IFSC, bank name

### 3. Supply & Transport Logistics
- `transport`: Mode of Transport (e.g. Courier / Road)
- `poNo`: Purchase Order Number
- `poDate`: Purchase Order Date
- `supplyDate`: Date of Supply
- `supplyTime`: Time of Supply
- `vehicle`: Vehicle Number
- `placeOfSupply`: Place of Supply
- `gstOpt`: `'with'` or `'without'` (for Quotations)
- `preparedBy`: Person preparing the quotation
- `dueDate`: Due Date / Quotation Expiration Date
- `payStatus`: Payment Status (`Paid`, `Unpaid`, `Partially Paid`, `Overdue`, etc.)

### 4. Parties
- **Receiver (Billed To)**:
  - `name`, `address`, `state`, `stateCode`, `gstin`
- **Consignee (Shipped To)**:
  - `same`: Boolean
  - `name`, `address`, `state`, `stateCode`, `gstin`

### 5. Line Items (`items` array)
- `name`: Item name
- `desc`: Description of Goods
- `hsn`: HSN Code
- `qty`: Quantity
- `unit`: Unit of measurement (`Nos.`, etc.)
- `rate`: Unit rate (₹)
- `disc`: Discount (₹)
- `gst`: GST rate percentage
- `taxable`: Taxable value
- `cgstRate`, `cgstAmount`, `sgstRate`, `sgstAmount`, `igstRate`, `igstAmount`, `net`

### 6. Taxes & Financial Totals
- `taxMode`: `'auto'`, `'intra'` (CGST+SGST), or `'inter'` (IGST)
- `freight`: Freight / transport charge
- `roundMode`: `'auto'` (nearest ₹1) or `'none'`
- `terms`: Terms & Conditions
- `orientation`: `'portrait'` or `'landscape'`
- `totals`: `subTotal`, `totalDiscount`, `totalTaxable`, `cgstTotal`, `sgstTotal`, `igstTotal`, `grossTotal`, `roundOff`, `grandTotal`, `grandTotalWords`

---

## 🚀 How to Run

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Open the Application**:
   - **Landing Page**: [http://localhost:3000/](http://localhost:3000/) (Displays the Login page)
   - Upon successful login, the app automatically redirects to the Bill Generator at [http://localhost:3000/invoice](http://localhost:3000/invoice).
   - If an unauthenticated user tries to directly navigate to `/invoice`, they are automatically redirected back to the login page.
