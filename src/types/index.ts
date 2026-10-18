export type UserRole = 'BGH' | 'TO_TRUONG' | 'GIAO_VIEN';

export interface UserProfile {
  id: string;
  name: string;
  code: string; // e.g. "GV012"
  role: UserRole;
  departmentId: string;
  departmentName: string;
  subject: string;
  homeroomClass?: string;
  phone: string;
  email: string;
  position: string; // e.g. "Hiệu phó Chuyên môn", "Tổ trưởng", "Giáo viên bộ môn"
  standardPeriods: number; // Định mức chuẩn: e.g. 19
  reductionPeriods: number; // Tiết giảm trừ (chủ nhiệm 4, tổ trưởng 3, công đoàn 3...)
  actualPeriods: number; // Số tiết thực tế đang dạy
  avatar: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  leaderId: string;
  leaderName: string;
  deputyId?: string;
  deputyName?: string;
  memberCount: number;
  subjects: string[];
  description: string;
  regularMeetingDay: string; // e.g. "Chiều Thứ 5 tuần 2 & 4"
  lastMeetingDate?: string;
}

export interface TeachingAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  departmentId: string;
  subject: string;
  grade?: number | string; // Để trống hoặc giáo viên tự nhập (Trường dự bị không dạy theo khối THPT)
  className: string; // e.g. "DB-A1", "DB-A2", "K50"...
  periodsPerWeek: number;
  semester: 'HK1' | 'HK2' | 'CA_NAM';
  academicYear: string; // "2026-2027"
  notes?: string;
}

export type RecordStatus = 'CHO_DUYET' | 'DA_DUYET' | 'YEU_CAU_CHINH_SUA' | 'CHUA_NOP' | 'DRAFT';

export interface BaoGiangEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  departmentId: string;
  week: number;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Thứ 2", "Thứ 3", ...
  period: number; // 1, 2, 3, 4, 5
  session: 'SANG' | 'CHIEU';
  className: string;
  subject: string;
  curriculumPeriod: number; // Tiết PPCT
  lessonTitle: string;
  equipment: string; // Đồ dùng / thiết bị / phần mềm
  notes?: string;
  status: RecordStatus;
  approvedBy?: string;
  approvalDate?: string;
  feedback?: string;
}

export interface GiaoAnItem {
  id: string;
  teacherId: string;
  teacherName: string;
  departmentId: string;
  departmentName: string;
  subject: string;
  grade?: number | string; // Để trống hoặc tự nhập (Trường dự bị không dạy theo khối THPT)
  week: number;
  curriculumPeriods: string; // "Tiết 45-47"
  unitName: string;
  lessonTitle: string;
  formatType: 'CV_5512' | 'TRUYEN_THONG' | 'STEM_PROJECT';
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: RecordStatus;
  rating?: 'XUAT_SAC' | 'TOT' | 'KHA' | 'DAT' | 'CHUA_DAT';
  reviewerId?: string;
  reviewerName?: string;
  reviewNotes?: string;
  has4Steps: boolean; // Khởi động, Khám phá kiến thức, Luyện tập, Vận dụng (CV 5512)
  competencies: string[]; // Phát triển năng lực tự chủ, giải quyết vấn đề...
}

export type KeHoachType =
  | 'TRUONG'
  | 'TO_CHUYEN_MON'
  | 'LICH_TRINH_GIANG_DAY'
  | 'BIEN_BAN_TO'
  | 'HO_SO_TO'
  | 'CA_NHAN'
  | 'CHU_DE_STEM'
  | 'HOAT_DONG_TRAI_NGHIEM';

export interface WeeklyBaoGiangFile {
  id: string;
  teacherId: string;
  teacherName: string;
  departmentId: string;
  departmentName: string;
  week: number;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  status: RecordStatus;
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
}

export interface KeHoachItem {
  id: string;
  title: string;
  type: KeHoachType;
  docNumber?: string;
  authorId: string;
  authorName: string;
  departmentId?: string;
  departmentName?: string;
  academicYear: string;
  semester: string;
  status: 'DRAFT' | 'CHO_PHE_DUYET' | 'DA_BAN_HANH';
  signDate?: string;
  summary: string;
  fileUrl?: string;
  fileName: string;
}

export type RequestType = 'NGHI_DAY' | 'DAY_THAY' | 'DOI_GIO';

export interface AbsenceAndSwapRequest {
  id: string;
  code: string;
  type: RequestType;
  requestTeacherId: string;
  requestTeacherName: string;
  departmentId: string;
  date: string; // Ngày phát sinh
  periods: number[]; // Tiết: [1, 2]
  session: 'SANG' | 'CHIEU';
  className: string;
  subject: string;
  curriculumPeriod: number;
  lessonTitle: string;
  reason: string;
  // Dạy thay
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  // Đổi giờ
  swapDate?: string;
  swapPeriod?: number;
  swapClass?: string;
  swapWithTeacherId?: string;
  swapWithTeacherName?: string;
  
  status: 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI';
  approvedBy?: string;
  approvedDate?: string;
  notes?: string;
  isPaidSubstitute?: boolean; // Được tính tiết kiêm dạy thay thanh toán cuối kỳ
}

export interface NeNepRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  departmentName: string;
  date: string;
  type: 'DU_GIO' | 'KIEM_TRA_DOT_XUAT' | 'KIEM_TRA_HO_SO' | 'NE_NEP_GIO_DAY';
  className: string;
  subject: string;
  lessonTitle: string;
  inspectorName: string;
  inspectorRole: string;
  // Điểm số theo thang 20 điểm chuẩn Bộ GD&ĐT
  scores: {
    keHoachBaiDay: number; // Kế hoạch bài dạy (CV 5512): max 5
    hoatDongHocSinh: number; // Hoạt động học của học sinh: max 5
    phuongPhapDayHoc: number; // Phương pháp và thiết bị dạy học: max 5
    hieuQuaTietDay: number; // Đạt mục tiêu bài dạy & nề nếp: max 5
  };
  totalScore: number; // Max 20
  ranking: 'XUAT_SAC' | 'TOT' | 'KHA' | 'DAT' | 'CHUA_DAT';
  feedback: string;
  punishmentOrReward?: string;
}

export interface HoSoMatrixItem {
  teacherId: string;
  teacherName: string;
  code: string;
  departmentName: string;
  subject: string;
  baoGiangStatus: 'DA_NOP_DU' | 'DANG_CHO_DUYET' | 'CHUA_NOP' | 'TRE_HAN';
  baoGiangRate: number; // 0 - 100%
  giaoAnStatus: 'DA_NOP_DU' | 'DANG_CHO_DUYET' | 'CHUA_NOP' | 'CAN_SUA';
  giaoAnCount: { submitted: number; required: number };
  duGioCount: { actual: number; required: number }; // Tiết đã dự giờ
  keHoachStatus: 'DA_DUYET' | 'CHUA_NOP' | 'DANG_CHO_DUYET';
  soDiemDienTu: 'DA_CAP_NHAT' | 'CHAM_DIEM' | 'DU_DIEM';
  overallStatus: 'XUAT_SAC' | 'DAT_CHUAN' | 'CHUA_DAT' | 'CANH_BAO';
  lastCheckedDate: string;
}

export interface SchoolStats {
  totalTeachers: number;
  totalDepartments: number;
  totalClasses: number;
  currentWeek: number;
  currentSemester: string;
  academicYear: string;
  giaoAnSubmittedRate: number; // %
  baoGiangApprovedRate: number; // %
  pendingSwapRequests: number;
  substitutePeriodsThisMonth: number;
  complianceWarningCount: number;
}
