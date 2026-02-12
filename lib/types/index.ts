// ==================== Auth ====================
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

export interface AuthResponse {
  token: string;
  user: User;
}

// ==================== API Response ====================
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

// ==================== Project ====================
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
  user?: User;
  joined_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  total_budget: number;
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
export interface Invoice {
  id: number;
  project_id: number;
  invoice_number: string;
  amount: number;
  file_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploaded_by: number;
  approved_by?: number;
  project?: Project;
  uploader?: User;
  approver?: User;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceRequest {
  project_id: number;
  amount: number;
  file_url: string;
}

export interface UpdateInvoiceRequest {
  amount?: number;
  file_url?: string;
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
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  user?: User;
  created_at: string;
}

// ==================== Upload ====================
export interface UploadResponse {
  file_url: string;
}
