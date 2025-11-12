export const SQLITE_PRAGMAS = [`PRAGMA foreign_keys = ON;`];

export const CREATE_TABLE_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS doctor (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    specialty TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    revenue_share_percent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS patient (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    full_name_ar TEXT NOT NULL,
    full_name_en TEXT,
    gender TEXT NOT NULL,
    dob TEXT,
    phone TEXT,
    address TEXT,
    notes_medical TEXT,
    doctor_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS tooth_status (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    label_ar TEXT NOT NULL,
    label_en TEXT,
    color TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS patient_tooth (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    tooth_number INTEGER NOT NULL,
    status_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES tooth_status(id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS appointment (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    start TEXT NOT NULL,
    end TEXT NOT NULL,
    room TEXT,
    status TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    date TEXT NOT NULL,
    procedures_json TEXT NOT NULL,
    teeth_json TEXT NOT NULL,
    materials_json TEXT NOT NULL,
    duration_min INTEGER NOT NULL,
    fee_yer INTEGER NOT NULL,
    attachments_json TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS invoice (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    date TEXT NOT NULL,
    total_yer INTEGER NOT NULL,
    paid_yer INTEGER NOT NULL,
    status TEXT NOT NULL,
    linked_session_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
    FOREIGN KEY (linked_session_id) REFERENCES session(id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS receipt (
    id TEXT PRIMARY KEY,
    invoice_id TEXT,
    date TEXT NOT NULL,
    amount_yer INTEGER NOT NULL,
    method TEXT NOT NULL,
    reference TEXT,
    created_by TEXT NOT NULL,
    voided INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoice(id) ON DELETE SET NULL
  );`,
  `CREATE TABLE IF NOT EXISTS payment_voucher (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    amount_yer INTEGER NOT NULL,
    payee TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_by TEXT NOT NULL,
    voided INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS supplier (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS inventory_item (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT,
    sku TEXT,
    min_level INTEGER,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS inventory_batch (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    batch_no TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    qty_in INTEGER NOT NULL,
    qty_out INTEGER NOT NULL,
    cost_yer INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (item_id) REFERENCES inventory_item(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS lab_order (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    type TEXT NOT NULL,
    sent_date TEXT NOT NULL,
    due_date TEXT,
    lab_name TEXT,
    cost_yer INTEGER,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patient(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctor(id) ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS ledger (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    ref_id TEXT,
    direction TEXT NOT NULL,
    amount_yer INTEGER NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    ts TEXT NOT NULL,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    delta_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS attachment (
    id TEXT PRIMARY KEY,
    owner_type TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    data_url TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`
];

export const CREATE_INDEX_STATEMENTS = [
  `CREATE INDEX IF NOT EXISTS idx_patient_name_ar ON patient(full_name_ar);`,
  `CREATE INDEX IF NOT EXISTS idx_patient_phone ON patient(phone);`,
  `CREATE INDEX IF NOT EXISTS idx_appointment_start ON appointment(start);`,
  `CREATE INDEX IF NOT EXISTS idx_invoice_date ON invoice(date);`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_batch_expiry ON inventory_batch(expiry_date);`
];

