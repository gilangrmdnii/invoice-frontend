export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'SPV' | 'FINANCE' | 'OWNER';
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  role: 'SPV' | 'FINANCE' | 'OWNER';
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  password: string;
  role: 'SPV' | 'FINANCE' | 'OWNER';
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  password?: string;
  role?: 'SPV' | 'FINANCE' | 'OWNER';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  total_budget: number;
  spent_amount: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  total_budget?: number;
  plan_items?: { description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[];
  plan_labels?: { description: string; items: { description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[] }[];
}

// ==================== Project Plan ====================
export interface ProjectPlanItem {
  id: number;
  project_id: number;
  parent_id?: number | null;
  is_label: boolean;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PlanItemRequest {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

export interface PlanLabelRequest {
  description: string;
  items: PlanItemRequest[];
}

export interface UpdateProjectPlanRequest {
  items?: { description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[];
  labels?: { description: string; items: { description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[] }[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
}

export interface AddMemberRequest {
  user_id: number;
}

// ==================== Invoice ====================
export type InvoiceType = 'DP' | 'FINAL_PAYMENT' | 'TOP_1' | 'TOP_2' | 'TOP_3' | 'MEALS' | 'ADDITIONAL';

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  DP: 'Down Payment (DP)',
  FINAL_PAYMENT: 'Final Payment',
  TOP_1: 'Termin 1 (TOP 1)',
  TOP_2: 'Termin 2 (TOP 2)',
  TOP_3: 'Termin 3 (TOP 3)',
  MEALS: 'Meals',
  ADDITIONAL: 'Additional',
};

export interface InvoiceItem {
  id?: number;
  invoice_id?: number;
  parent_id?: number | null;
  is_label?: boolean;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  subtotal: number;
  sort_order?: number;
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL_PAID' | 'PAID';
export type PaymentMethod = 'TRANSFER' | 'CASH' | 'GIRO' | 'OTHER';

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Belum Bayar',
  PARTIAL_PAID: 'Bayar Sebagian',
  PAID: 'Lunas',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  TRANSFER: 'Transfer',
  CASH: 'Cash',
  GIRO: 'Giro',
  OTHER: 'Lainnya',
};

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  proof_url?: string;
  notes?: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: InvoiceType;
  project_id: number;
  project_name?: string;
  amount: number;
  paid_amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  payment_status: PaymentStatus;
  file_url?: string;
  recipient_name: string;
  recipient_address?: string;
  attention?: string;
  po_number?: string;
  invoice_date: string;
  due_date?: string;
  dp_percentage?: number;
  subtotal: number;
  ppn_percentage: number;
  ppn_amount: number;
  pph_percentage: number;
  pph_amount: number;
  notes?: string;
  language: 'ID' | 'EN';
  created_by: number;
  approved_by?: number;
  reject_notes?: string;
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  created_at: string;
  updated_at: string;
}

export interface CreateInvoicePaymentRequest {
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  proof_url?: string;
  notes?: string;
}

export interface InvoiceLabelRequest {
  description: string;
  items: { description: string; quantity: number; unit: string; unit_price: number; subtotal: number }[];
}

export interface CreateInvoiceRequest {
  project_id: number;
  invoice_type: InvoiceType;
  recipient_name: string;
  recipient_address?: string;
  attention?: string;
  po_number?: string;
  invoice_date: string;
  due_date?: string;
  dp_percentage?: number;
  ppn_percentage: number;
  pph_percentage: number;
  notes?: string;
  language: 'ID' | 'EN';
  file_url?: string;
  items?: Omit<InvoiceItem, 'id' | 'invoice_id' | 'sort_order'>[];
  labels?: InvoiceLabelRequest[];
}

export interface UpdateInvoiceRequest {
  recipient_name?: string;
  recipient_address?: string;
  attention?: string;
  po_number?: string;
  invoice_date?: string;
  dp_percentage?: number;
  ppn_percentage?: number;
  pph_percentage?: number;
  notes?: string;
  language?: 'ID' | 'EN';
  file_url?: string;
  items?: Omit<InvoiceItem, 'id' | 'invoice_id' | 'sort_order'>[];
  labels?: InvoiceLabelRequest[];
}

// ==================== Company Settings ====================
export interface CompanySettings {
  id: number;
  company_name: string;
  company_code: string;
  address?: string;
  phone?: string;
  email?: string;
  npwp?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_branch?: string;
  logo_url?: string;
  signatory_name?: string;
  signatory_title?: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertCompanySettingsRequest {
  company_name: string;
  company_code: string;
  address?: string;
  phone?: string;
  email?: string;
  npwp?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_name?: string;
  bank_branch?: string;
  logo_url?: string;
  signatory_name?: string;
  signatory_title?: string;
}

// ==================== Expense ====================
export interface Expense {
  id: number;
  project_id: number;
  description: string;
  amount: number;
  category: string;
  receipt_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_by: number;
  approved_by?: number;
  project?: Project;
  creator?: User;
  approver?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateExpenseRequest {
  project_id: number;
  description: string;
  amount: number;
  category: string;
  receipt_url?: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  category?: string;
  receipt_url?: string;
}

export interface ApprovalRequest {
  notes?: string;
  proof_url?: string;
}

// ==================== Budget Request ====================
export interface BudgetRequest {
  id: number;
  project_id: number;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by: number;
  approved_by?: number;
  project?: Project;
  requester?: User;
  approver?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetRequest {
  project_id: number;
  amount: number;
  reason: string;
}

// ==================== Dashboard ====================
export interface DashboardData {
  projects: {
    total_projects: number;
    active_projects: number;
  };
  budget: {
    total_budget: number;
    total_spent: number;
    remaining: number;
  };
  expenses: {
    total_expenses: number;
    pending_expenses: number;
    approved_expenses: number;
    rejected_expenses: number;
    total_amount: number;
  };
  budget_requests: {
    total_requests: number;
    pending_requests: number;
    approved_requests: number;
    rejected_requests: number;
    total_amount: number;
  };
  invoices: {
    total_invoices: number;
    total_amount: number;
  };
}

// ==================== Notification ====================
export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  reference_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCount {
  count: number;
}

// ==================== Audit Log ====================
export interface AuditLog {
  id: number;
  user_id: number;
  full_name: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  created_at: string;
}

// ==================== Upload ====================
export interface UploadResponse {
  file_url: string;
}
