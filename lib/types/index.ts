export interface User {
  id: number;
  full_name: string;
  email: string;
  role: 'SPV' | 'QC' | 'QC_COORDINATOR' | 'FINANCE' | 'OWNER';
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
  role: 'SPV' | 'QC' | 'QC_COORDINATOR' | 'FINANCE' | 'OWNER';
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  password: string;
  role: 'SPV' | 'QC' | 'QC_COORDINATOR' | 'FINANCE' | 'OWNER';
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  password?: string;
  role?: 'SPV' | 'QC' | 'QC_COORDINATOR' | 'FINANCE' | 'OWNER';
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
  total_budget: number;
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
  days: number;
  amount: number;
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
  created_by: number;
  project?: Project;
  creator?: User;
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
  proof_url?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by: number;
  approved_by?: number;
  approval_notes?: string;
  approval_proof_url?: string;
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
  proof_url: string;
}

export interface ApproveBudgetRequest {
  notes?: string;
  proof_url: string;
}

export interface RejectBudgetRequest {
  notes?: string;
  proof_url: string;
}

// ==================== Dashboard ====================
export interface DashboardData {
  projects: {
    total_projects: number;
    active_projects: number;
  };
  budget: {
    total_budget: number;
    total_plan_budget: number;
    total_spent: number;
    remaining: number;
  };
  expenses: {
    total_expenses: number;
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

// ==================== QC Document ====================
export type DocumentType = 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  IMAGE: 'Gambar',
  AUDIO: 'Audio',
  VIDEO: 'Video',
  DOCUMENT: 'Dokumen',
};

export interface QCDocument {
  id: number;
  project_id: number;
  title: string;
  description: string;
  document_type: DocumentType;
  file_url: string;
  uploaded_by: number;
  uploader_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateQCDocumentRequest {
  project_id: number;
  title: string;
  description?: string;
  document_type: DocumentType;
  file_url: string;
}

export interface UpdateQCDocumentRequest {
  title?: string;
  description?: string;
  document_type?: DocumentType;
  file_url?: string;
}

// ==================== Finance Report ====================
export interface FinanceRecruiterFee {
  id?: number;
  recruiter_name: string;
  jumlah: number;
  fee_recruiter: number;
  insentif_responden_main: number;
  jumlah_responden_main: number;
  insentif_responden_backup: number;
  jumlah_responden_backup: number;
  sort_order?: number;
  total?: number;
}

export interface FinanceSampleEntry {
  id?: number;
  tanggal_pelaksanaan: string;
  jumlah_sample: number;
  insentif_responden_main: number;
  jumlah_responden_main: number;
  insentif_responden_backup: number;
  jumlah_responden_backup: number;
  sort_order?: number;
  total?: number;
}

export interface FinanceManualExpense {
  id?: number;
  member_user_id: number | null;
  member_name: string;
  category: string;
  tanggal: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount?: number;
  sort_order?: number;
}

export interface MemberBreakdown {
  user_id: number;
  full_name: string;
  role: string;
  categories: Record<string, number>;
  total: number;
}

export interface DateExpenseRow {
  tanggal: string;
  member_name: string;
  uang_masuk: number;
  uang_keluar: number;
}

export interface FinanceReport {
  project_id: number;
  project_name: string;
  execution_start_date: string | null;
  execution_end_date: string | null;
  spv_names: string;
  qc_names: string;
  jumlah_main: number;
  jumlah_backup: number;
  member_breakdowns: MemberBreakdown[];
  daily_expenses: DateExpenseRow[];
  recruiter_fees: FinanceRecruiterFee[];
  sample_entries: FinanceSampleEntry[];
  manual_expenses: FinanceManualExpense[];
  total_pengeluaran: number;
  total_perolehan_recruit: number;
  total_sample_incentive: number;
  total_yang_dibayarkan: number;
}

export interface UpsertFinanceReportRequest {
  recruiter_fees: Omit<FinanceRecruiterFee, 'id' | 'total'>[];
  sample_entries: Omit<FinanceSampleEntry, 'id' | 'total'>[];
  manual_expenses: Omit<FinanceManualExpense, 'id' | 'amount'>[];
}

export const FINANCE_EXPENSE_CATEGORIES = [
  'SPV',
  'UANG_MAKAN',
  'PULSA',
  'RECORDING',
  'INPUT_PERPI',
  'BENSIN',
  'BRIEFING',
  'TRANSPORT',
  'LAIN_LAIN',
] as const;

export const FINANCE_CATEGORY_LABELS: Record<string, string> = {
  SPV: 'SPV',
  UANG_MAKAN: 'Uang Makan',
  PULSA: 'Pulsa',
  RECORDING: 'Recording',
  INPUT_PERPI: 'Input Perpi',
  BENSIN: 'Bensin',
  BRIEFING: 'Briefing',
  TRANSPORT: 'Transport',
  LAIN_LAIN: 'Lain-lain',
};

// ==================== QC Financial Report ====================
export type QCProjectType = 'KUALITATIF' | 'KUANTITATIF';
export type QCMethodology = 'FGD_TRIAD' | 'HOME_VISIT' | 'CLT' | 'IDI' | 'RANDOM';
export type QCArea = 'URBAN' | 'RURAL' | 'URBAN_RURAL';
export type QCItemCategory =
  | 'VISIT_URBAN'
  | 'VISIT_RURAL'
  | 'TELP_QUAL'
  | 'TELP_QUANT'
  | 'CLT_TIMESHEET'
  | 'RECORDING'
  | 'UANG_MAKAN'
  | 'INPUT_PERPI'
  | 'PARKIR'
  | 'BENSIN'
  | 'LAIN_LAIN';
export type QCItemStatus = 'OK' | 'DO' | 'NONE';
export type QCReportStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';

export const QC_REPORT_STATUS_LABELS: Record<QCReportStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Menunggu Approval',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
};

export const QC_PROJECT_TYPE_LABELS: Record<QCProjectType, string> = {
  KUALITATIF: 'Kualitatif',
  KUANTITATIF: 'Kuantitatif',
};

export const QC_METHODOLOGY_LABELS: Record<QCMethodology, string> = {
  FGD_TRIAD: 'FGD / Triad',
  HOME_VISIT: 'Home Visit / Ethno',
  CLT: 'CLT',
  IDI: 'IDI',
  RANDOM: 'Random',
};

export const QC_AREA_LABELS: Record<QCArea, string> = {
  URBAN: 'Urban',
  RURAL: 'Rural',
  URBAN_RURAL: 'Urban & Rural',
};

export const QC_CATEGORY_LABELS: Record<QCItemCategory, string> = {
  VISIT_URBAN: 'Visit Urban',
  VISIT_RURAL: 'Visit Rural',
  TELP_QUAL: 'Telp Qual',
  TELP_QUANT: 'Telp Quant',
  CLT_TIMESHEET: 'CLT / Time Sheet',
  RECORDING: 'Recording',
  UANG_MAKAN: 'Uang Makan',
  INPUT_PERPI: 'Input Perpi',
  PARKIR: 'Parkir',
  BENSIN: 'Bensin',
  LAIN_LAIN: 'Lain-lain',
};

export interface QCReportItem {
  id?: number;
  category: QCItemCategory;
  status: QCItemStatus;
  label: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sort_order: number;
  created_at?: string;
}

export interface QCRecruiterPerformance {
  id?: number;
  recruiter_name: string;
  total: number;
  ok_perpi: number;
  do_perpi: number;
  ok_qc: number;
  do_qc: number;
  notes: string;
  sort_order: number;
  created_at?: string;
}

export interface QCReport {
  id: number;
  project_id: number;
  project_name: string;
  qc_user_id: number;
  qc_user_name: string;
  spv_names: string;
  project_type: QCProjectType;
  methodology: QCMethodology;
  city: string;
  area: QCArea;
  execution_start_date: string | null;
  execution_end_date: string | null;
  briefing_date: string | null;
  work_start_date: string | null;
  work_end_date: string | null;
  visit_target: number;
  visit_ok: number;
  telp_target: number;
  telp_ok: number;
  total_amount: number;
  status: QCReportStatus;
  approved_by: number | null;
  approver_name: string;
  approval_notes: string;
  approved_at: string | null;
  location: string;
  report_date: string | null;
  qc_signatory_name: string;
  qc_signatory_title: string;
  coordinator_signatory_name: string;
  coordinator_signatory_title: string;
  note: string;
  created_by: number;
  creator_name: string;
  items: QCReportItem[];
  recruiters: QCRecruiterPerformance[];
  created_at: string;
  updated_at: string;
}

export interface QCReportItemRequest {
  category: QCItemCategory;
  status?: QCItemStatus;
  label?: string;
  quantity: number;
  unit_price: number;
  sort_order?: number;
}

export interface QCRecruiterPerformanceRequest {
  recruiter_name: string;
  total: number;
  ok_perpi: number;
  do_perpi: number;
  ok_qc: number;
  do_qc: number;
  notes?: string;
  sort_order?: number;
}

export interface CreateQCReportRequest {
  project_id: number;
  qc_user_id: number;
  spv_names?: string;
  project_type: QCProjectType;
  methodology: QCMethodology;
  city?: string;
  area: QCArea;
  execution_start_date?: string | null;
  execution_end_date?: string | null;
  briefing_date?: string | null;
  work_start_date?: string | null;
  work_end_date?: string | null;
  visit_target: number;
  visit_ok: number;
  telp_target: number;
  telp_ok: number;
  location?: string;
  report_date?: string | null;
  qc_signatory_name?: string;
  qc_signatory_title?: string;
  coordinator_signatory_name?: string;
  coordinator_signatory_title?: string;
  note?: string;
  items: QCReportItemRequest[];
  recruiters: QCRecruiterPerformanceRequest[];
}

export type UpdateQCReportRequest = Partial<Omit<CreateQCReportRequest, 'project_id'>>;

// ==================== Project Worker ====================
export interface ProjectWorker {
  id: number;
  project_id: number;
  full_name: string;
  role: string;
  phone: string;
  daily_wage: number;
  is_active: boolean;
  added_by: number;
  adder_name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectWorkerRequest {
  full_name: string;
  role: string;
  phone?: string;
  daily_wage?: number;
}

export interface UpdateProjectWorkerRequest {
  full_name?: string;
  role?: string;
  phone?: string;
  daily_wage?: number;
  is_active?: boolean;
}

// ==================== Upload ====================
export interface UploadResponse {
  file_url: string;
}
