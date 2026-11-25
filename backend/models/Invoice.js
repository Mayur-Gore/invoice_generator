const mongoose = require('mongoose');

// Item Sub-schema
const itemSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  desc: { type: String, default: '' },
  hsn: { type: String, default: '' },
  qty: { type: Number, default: 1 },
  unit: { type: String, default: 'Nos.' },
  rate: { type: Number, default: 0 },
  disc: { type: Number, default: 0 },
  gst: { type: Number, default: 18 },
  taxable: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  net: { type: Number, default: 0 }
});

// Main Invoice / Bill Schema based on comprehensive analysis of Techwave bill structure
const invoiceSchema = new mongoose.Schema(
  {
    docType: {
      type: String,
      enum: ['invoice', 'quotation'],
      default: 'invoice',
      index: true
    },
    invNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    // Company / Vendor Details (Issuer)
    company: {
      name: { type: String, default: 'Techwave Enterprises' },
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
      gstin: { type: String, default: '' },
      state: { type: String, default: 'Maharashtra' },
      stateCode: { type: String, default: '27' },
      bank: { type: String, default: '' }
    },
    // Invoice / Quotation Metadata
    transport: { type: String, default: '' },
    poNo: { type: String, default: '' },
    poDate: { type: String, default: '' },
    supplyDate: { type: String, default: '' },
    supplyTime: { type: String, default: '' },
    vehicle: { type: String, default: '' },
    placeOfSupply: { type: String, default: '' },
    gstOpt: { type: String, enum: ['with', 'without'], default: 'with' },
    preparedBy: { type: String, default: '' },
    dueDate: { type: String, default: '' },
    payStatus: { type: String, default: '' },

    // Receiver (Billed To) Details
    receiver: {
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      state: { type: String, default: 'Maharashtra' },
      stateCode: { type: String, default: '27' },
      gstin: { type: String, default: '' }
    },

    // Consignee (Shipped To) Details
    consignee: {
      same: { type: Boolean, default: true },
      name: { type: String, default: '' },
      address: { type: String, default: '' },
      state: { type: String, default: '' },
      stateCode: { type: String, default: '' },
      gstin: { type: String, default: '' }
    },

    // Itemized billing list
    items: [itemSchema],

    // Calculations, Tax & Totals
    taxMode: { type: String, enum: ['auto', 'intra', 'inter'], default: 'auto' },
    taxType: { type: String, enum: ['intra', 'inter'], default: 'intra' },
    freight: { type: Number, default: 0 },
    roundMode: { type: String, enum: ['auto', 'none'], default: 'auto' },
    terms: { type: String, default: '' },
    orientation: { type: String, enum: ['portrait', 'landscape'], default: 'portrait' },

    // Financial totals summary
    totals: {
      subTotal: { type: Number, default: 0 },
      totalDiscount: { type: Number, default: 0 },
      totalTaxable: { type: Number, default: 0 },
      cgstTotal: { type: Number, default: 0 },
      sgstTotal: { type: Number, default: 0 },
      igstTotal: { type: Number, default: 0 },
      grossTotal: { type: Number, default: 0 },
      roundOff: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
      grandTotalWords: { type: String, default: '' }
    },

    // Raw form state if needed for seamless round-trip editing
    rawFormState: { type: mongoose.Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
