import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  UserProfile,
  Department,
  TeachingAssignment,
  BaoGiangEntry,
  GiaoAnItem,
  KeHoachItem,
  AbsenceAndSwapRequest,
  NeNepRecord,
  HoSoMatrixItem,
  SchoolStats,
  WeeklyBaoGiangFile
} from '../types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_TEACHERS,
  INITIAL_ASSIGNMENTS,
  INITIAL_BAO_GIANG,
  INITIAL_GIAO_AN,
  INITIAL_KE_HOACH,
  INITIAL_REQUESTS,
  INITIAL_NE_NEP,
  INITIAL_HOSO_MATRIX,
  INITIAL_SCHOOL_STATS,
  INITIAL_WEEKLY_BAO_GIANG_FILES,
  CURRENT_WEEK,
  CURRENT_ACADEMIC_YEAR,
  CURRENT_SEMESTER
} from '../data/mockData';

export type ActiveTab =
  | 'dashboard'
  | 'departments'
  | 'teaching_assignments'
  | 'bao_giang'
  | 'ke_hoach'
  | 'giao_an'
  | 'nghi_day_day_thay'
  | 'ne_nep_du_gio'
  | 'ho_so_matrix'
  | 'reports';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface AppContextType {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  selectedDepartment: string;
  setSelectedDepartment: (depId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Data
  departments: Department[];
  teachers: UserProfile[];
  assignments: TeachingAssignment[];
  baoGiangList: BaoGiangEntry[];
  weeklyBaoGiangFiles: WeeklyBaoGiangFile[];
  giaoAnList: GiaoAnItem[];
  keHoachList: KeHoachItem[];
  requests: AbsenceAndSwapRequest[];
  neNepList: NeNepRecord[];
  hoSoMatrix: HoSoMatrixItem[];
  stats: SchoolStats;

  // Academic Year
  academicYear: string;
  setAcademicYear: (year: string) => void;

  // Teacher Management
  addTeacher: (teacher: Omit<UserProfile, 'id'>) => void;
  deleteTeacher: (id: string) => void;
  deleteTeachersByDepartment: (deptId: string) => void;
  resetTeachersToCore: () => void;
  importTeachers: (newTeachers: UserProfile[]) => void;

  // Actions
  approveBaoGiang: (id: string, feedback?: string) => void;
  rejectBaoGiang: (id: string, feedback: string) => void;
  addBaoGiangEntry: (entry: Omit<BaoGiangEntry, 'id'>) => void;
  deleteBaoGiangEntry: (id: string) => void;
  addWeeklyBaoGiangFile: (file: Omit<WeeklyBaoGiangFile, 'id' | 'uploadDate' | 'status'>) => void;
  approveWeeklyBaoGiangFile: (id: string) => void;
  deleteWeeklyBaoGiangFile: (id: string) => void;
  approveGiaoAn: (id: string, rating: 'XUAT_SAC' | 'TOT' | 'KHA' | 'DAT', reviewNotes?: string) => void;
  requestGiaoAnRevision: (id: string, reviewNotes: string) => void;
  addGiaoAn: (item: Omit<GiaoAnItem, 'id' | 'uploadDate' | 'status'>) => void;
  approveRequest: (id: string, notes?: string) => void;
  rejectRequest: (id: string, notes: string) => void;
  createRequest: (req: Omit<AbsenceAndSwapRequest, 'id' | 'code' | 'status'>) => void;
  addAssignment: (assignment: Omit<TeachingAssignment, 'id'>) => void;
  deleteAssignment: (id: string) => void;
  addNeNepRecord: (record: Omit<NeNepRecord, 'id'>) => void;
  addKeHoach: (item: Omit<KeHoachItem, 'id'>) => void;
  deleteKeHoach: (id: string) => void;
  remindTeacher: (teacherId: string, recordName: string) => void;
  resetAllData: () => void;

  // Toast
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Google Workspace Sync Modal & Connected Sheet
  isGoogleModalOpen: boolean;
  googleModalTab: 'sheets' | 'drive' | 'github';
  openGoogleSync: (tab?: 'sheets' | 'drive' | 'github') => void;
  closeGoogleSync: () => void;
  connectedSheet: { id: string; name: string; url: string; lastSynced?: string } | null;
  setConnectedSheet: (sheet: { id: string; name: string; url: string; lastSynced?: string } | null) => void;
  importGiaoAnList: (newItems: GiaoAnItem[]) => void;
  importBaoGiangList: (newItems: BaoGiangEntry[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'HSCM_DBSS_V7_';

function getStored<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Error loading ${key} from storage`, e);
  }
  return defaultValue;
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRoleState] = useState<UserRole>(() => getStored('ROLE', 'BGH'));
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => getStored('ACTIVE_TAB', 'dashboard'));
  const [selectedWeek, setSelectedWeek] = useState<number>(CURRENT_WEEK);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [academicYear, setAcademicYearState] = useState<string>(() => getStored('ACADEMIC_YEAR', CURRENT_ACADEMIC_YEAR));

  const setAcademicYear = (year: string) => {
    setAcademicYearState(year);
    setStored('ACADEMIC_YEAR', year);
  };

  const [departments, setDepartments] = useState<Department[]>(() => getStored('DEPARTMENTS', INITIAL_DEPARTMENTS));
  const [teachers, setTeachers] = useState<UserProfile[]>(() => getStored('TEACHERS', INITIAL_TEACHERS));
  const [assignments, setAssignments] = useState<TeachingAssignment[]>(() => getStored('ASSIGNMENTS', INITIAL_ASSIGNMENTS));
  const [baoGiangList, setBaoGiangList] = useState<BaoGiangEntry[]>(() => getStored('BAO_GIANG', INITIAL_BAO_GIANG));
  const [weeklyBaoGiangFiles, setWeeklyBaoGiangFiles] = useState<WeeklyBaoGiangFile[]>(() => getStored('WEEKLY_BAO_GIANG_FILES', INITIAL_WEEKLY_BAO_GIANG_FILES));
  const [giaoAnList, setGiaoAnList] = useState<GiaoAnItem[]>(() => getStored('GIAO_AN', INITIAL_GIAO_AN));
  const [keHoachList, setKeHoachList] = useState<KeHoachItem[]>(() => getStored('KE_HOACH', INITIAL_KE_HOACH));
  const [requests, setRequests] = useState<AbsenceAndSwapRequest[]>(() => getStored('REQUESTS', INITIAL_REQUESTS));
  const [neNepList, setNeNepList] = useState<NeNepRecord[]>(() => getStored('NE_NEP', INITIAL_NE_NEP));
  const [hoSoMatrix, setHoSoMatrix] = useState<HoSoMatrixItem[]>(() => getStored('HOSO_MATRIX', INITIAL_HOSO_MATRIX));
  const [stats, setStats] = useState<SchoolStats>(INITIAL_SCHOOL_STATS);

  // Default currentUser based on current role
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    if (currentRole === 'BGH') return teachers.find(t => t.id === 'gv-bgh01') || teachers[0];
    if (currentRole === 'TO_TRUONG') return teachers.find(t => t.id === 'gv-tt01') || teachers.find(t => t.role === 'TO_TRUONG') || teachers[0];
    return teachers.find(t => t.role === 'GIAO_VIEN') || teachers[teachers.length - 1] || teachers[0];
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Switch role helper
  const setRole = (newRole: UserRole) => {
    setCurrentRoleState(newRole);
    setStored('ROLE', newRole);
    if (newRole === 'BGH') {
      const bghUser = teachers.find(t => t.id === 'gv-bgh01') || teachers.find(t => t.role === 'BGH') || teachers[0];
      setCurrentUser(bghUser);
      addToast(`Đã chuyển sang quyền: Ban Giám Hiệu (${bghUser.name} - ${bghUser.position})`, 'info');
    } else if (newRole === 'TO_TRUONG') {
      const toTruong = teachers.find(t => t.id === 'gv-tt01') || teachers.find(t => t.role === 'TO_TRUONG') || teachers[0];
      setCurrentUser(toTruong);
      addToast(`Đã chuyển sang quyền: Tổ trưởng Chuyên môn (${toTruong.name} - ${toTruong.departmentName})`, 'info');
    } else {
      const gv = teachers.find(t => t.role === 'GIAO_VIEN') || teachers[teachers.length - 1] || teachers[0];
      setCurrentUser(gv);
      addToast(`Đã chuyển sang quyền: Giáo viên (${gv.name} - ${gv.departmentName})`, 'info');
    }
  };

  // Sync to local storage
  useEffect(() => { setStored('DEPARTMENTS', departments); }, [departments]);
  useEffect(() => { setStored('TEACHERS', teachers); }, [teachers]);
  useEffect(() => { setStored('ASSIGNMENTS', assignments); }, [assignments]);
  useEffect(() => { setStored('BAO_GIANG', baoGiangList); }, [baoGiangList]);
  useEffect(() => { setStored('WEEKLY_BAO_GIANG_FILES', weeklyBaoGiangFiles); }, [weeklyBaoGiangFiles]);
  useEffect(() => { setStored('GIAO_AN', giaoAnList); }, [giaoAnList]);
  useEffect(() => { setStored('KE_HOACH', keHoachList); }, [keHoachList]);
  useEffect(() => { setStored('REQUESTS', requests); }, [requests]);
  useEffect(() => { setStored('NE_NEP', neNepList); }, [neNepList]);
  useEffect(() => { setStored('HOSO_MATRIX', hoSoMatrix); }, [hoSoMatrix]);
  useEffect(() => { setStored('ACTIVE_TAB', activeTab); }, [activeTab]);

  // Recalculate stats dynamically
  useEffect(() => {
    const approvedBaoGiang = baoGiangList.filter(b => b.status === 'DA_DUYET').length;
    const totalBaoGiang = baoGiangList.length || 1;
    const approvedGiaoAn = giaoAnList.filter(g => g.status === 'DA_DUYET').length;
    const totalGiaoAn = giaoAnList.length || 1;
    const pendingRequests = requests.filter(r => r.status === 'CHO_DUYET').length;
    const warnings = hoSoMatrix.filter(h => h.overallStatus === 'CANH_BAO').length;

    setStats({
      totalTeachers: teachers.length,
      totalDepartments: departments.length,
      totalClasses: 36,
      currentWeek: selectedWeek,
      currentSemester: CURRENT_SEMESTER,
      academicYear: CURRENT_ACADEMIC_YEAR,
      giaoAnSubmittedRate: Math.round((approvedGiaoAn / totalGiaoAn) * 1000) / 10,
      baoGiangApprovedRate: Math.round((approvedBaoGiang / totalBaoGiang) * 1000) / 10,
      pendingSwapRequests: pendingRequests,
      substitutePeriodsThisMonth: 18,
      complianceWarningCount: warnings
    });
  }, [baoGiangList, giaoAnList, requests, hoSoMatrix, teachers, departments, selectedWeek]);

  // Actions
  const approveBaoGiang = (id: string, feedback?: string) => {
    setBaoGiangList(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: 'DA_DUYET',
              approvedBy: `${currentUser.name} (${currentUser.position})`,
              approvalDate: new Date().toISOString().split('T')[0],
              feedback: feedback || item.feedback
            }
          : item
      )
    );
    addToast('Đã duyệt sổ báo giảng thành công', 'success');
  };

  const rejectBaoGiang = (id: string, feedback: string) => {
    setBaoGiangList(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: 'YEU_CAU_CHINH_SUA',
              feedback
            }
          : item
      )
    );
    addToast('Đã gửi yêu cầu chỉnh sửa sổ báo giảng đến giáo viên', 'warning');
  };

  const addBaoGiangEntry = (entry: Omit<BaoGiangEntry, 'id'>) => {
    const newEntry: BaoGiangEntry = {
      ...entry,
      id: `bg-${Date.now()}`
    };
    setBaoGiangList(prev => [newEntry, ...prev]);
    addToast('Đã đăng ký thêm tiết dạy vào Sổ báo giảng', 'success');
  };

  const approveGiaoAn = (id: string, rating: 'XUAT_SAC' | 'TOT' | 'KHA' | 'DAT', reviewNotes?: string) => {
    setGiaoAnList(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: 'DA_DUYET',
              rating,
              reviewerId: currentUser.id,
              reviewerName: `${currentUser.name} (${currentUser.position})`,
              reviewNotes: reviewNotes || item.reviewNotes
            }
          : item
      )
    );
    addToast(`Đã duyệt Kế hoạch bài dạy - Xếp loại: ${rating}`, 'success');
  };

  const requestGiaoAnRevision = (id: string, reviewNotes: string) => {
    setGiaoAnList(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              status: 'YEU_CAU_CHINH_SUA',
              reviewerId: currentUser.id,
              reviewerName: `${currentUser.name} (${currentUser.position})`,
              reviewNotes
            }
          : item
      )
    );
    addToast('Đã trả lại giáo án kèm phản hồi sư phạm', 'warning');
  };

  const addGiaoAn = (item: Omit<GiaoAnItem, 'id' | 'uploadDate' | 'status'>) => {
    const newItem: GiaoAnItem = {
      ...item,
      id: `ga-${Date.now()}`,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'CHO_DUYET'
    };
    setGiaoAnList(prev => [newItem, ...prev]);
    addToast('Nộp Kế hoạch bài dạy (Giáo án) thành công, chờ tổ trưởng phê duyệt', 'success');
  };

  const approveRequest = (id: string, notes?: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id
          ? {
              ...req,
              status: 'DA_DUYET',
              approvedBy: `${currentUser.name} (${currentUser.position})`,
              approvedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
              notes: notes || req.notes
            }
          : req
      )
    );
    addToast('Đã phê duyệt đơn nghỉ dạy / đổi giờ / dạy thay', 'success');
  };

  const rejectRequest = (id: string, notes: string) => {
    setRequests(prev =>
      prev.map(req =>
        req.id === id
          ? {
              ...req,
              status: 'TU_CHOI',
              approvedBy: `${currentUser.name} (${currentUser.position})`,
              notes
            }
          : req
      )
    );
    addToast('Đã từ chối đơn yêu cầu', 'error');
  };

  const createRequest = (req: Omit<AbsenceAndSwapRequest, 'id' | 'code' | 'status'>) => {
    const typePrefix = req.type === 'DAY_THAY' ? 'YCDT' : req.type === 'DOI_GIO' ? 'YCDG' : 'YCND';
    const newReq: AbsenceAndSwapRequest = {
      ...req,
      id: `req-${Date.now()}`,
      code: `${typePrefix}-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'CHO_DUYET'
    };
    setRequests(prev => [newReq, ...prev]);
    addToast('Đã gửi yêu cầu đến Tổ trưởng & Ban Giám Hiệu', 'success');
  };

  const addAssignment = (assignment: Omit<TeachingAssignment, 'id'>) => {
    const newAssignment: TeachingAssignment = {
      ...assignment,
      id: `pc-${Date.now()}`
    };
    setAssignments(prev => [...prev, newAssignment]);
    addToast('Đã cập nhật phân công giảng dạy', 'success');
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    addToast('Đã xóa phân công giảng dạy', 'info');
  };

  const addNeNepRecord = (record: Omit<NeNepRecord, 'id'>) => {
    const newRecord: NeNepRecord = {
      ...record,
      id: `nn-${Date.now()}`
    };
    setNeNepList(prev => [newRecord, ...prev]);
    addToast('Đã lưu kết quả dự giờ / kiểm tra nề nếp chuyên môn', 'success');
  };

  const addTeacher = (teacherData: Omit<UserProfile, 'id'>) => {
    const newTeacher: UserProfile = {
      ...teacherData,
      id: `gv-${Date.now()}`
    };
    setTeachers(prev => [newTeacher, ...prev]);
    if (newTeacher.departmentId && newTeacher.departmentId !== 'dep-bgh') {
      setDepartments(prev =>
        prev.map(d => (d.id === newTeacher.departmentId ? { ...d, memberCount: d.memberCount + 1 } : d))
      );
    }
    addToast(`Đã thêm thành công: ${newTeacher.name} (${newTeacher.position})`, 'success');
  };

  const deleteTeacher = (id: string) => {
    const teacherToDelete = teachers.find(t => t.id === id);
    if (!teacherToDelete) return;
    setTeachers(prev => prev.filter(t => t.id !== id));
    if (teacherToDelete.departmentId && teacherToDelete.departmentId !== 'dep-bgh') {
      setDepartments(prev =>
        prev.map(d =>
          d.id === teacherToDelete.departmentId ? { ...d, memberCount: Math.max(0, d.memberCount - 1) } : d
        )
      );
    }
    setAssignments(prev => prev.filter(a => a.teacherId !== id));
    addToast(`Đã xóa cán bộ/giáo viên ${teacherToDelete.name} khỏi hệ thống`, 'info');
  };

  const importTeachers = (newTeachers: UserProfile[]) => {
    if (!newTeachers || newTeachers.length === 0) return;
    setTeachers(prev => {
      const existingCodes = new Set(prev.map(t => t.code.toLowerCase()));
      const filteredNew = newTeachers.filter(t => !existingCodes.has(t.code.toLowerCase()));
      return [...filteredNew, ...prev];
    });
    setDepartments(prevDepts => {
      return prevDepts.map(dept => {
        const total = [...newTeachers, ...teachers].filter(t => t.departmentId === dept.id).length;
        return { ...dept, memberCount: total };
      });
    });
    addToast(`Đã nạp thành công ${newTeachers.length} cán bộ/giáo viên vào hệ thống!`, 'success');
  };

  const deleteTeachersByDepartment = (deptId: string) => {
    // Keep BGH leaders (gv-bgh01, gv-bgh02, gv-bgh03) or To Truong (gv-tt01, gv-vnn01, gv-tn01, gv-xh01)
    const coreLeaderIds = new Set(['gv-bgh01', 'gv-bgh02', 'gv-bgh03', 'gv-tt01', 'gv-vnn01', 'gv-tn01', 'gv-xh01']);
    
    setTeachers(prev => {
      if (deptId === 'dep-bgh' || deptId === 'BGH') {
        return prev.filter(t => t.departmentId !== 'dep-bgh' && t.role !== 'BGH' || coreLeaderIds.has(t.id));
      }
      return prev.filter(t => t.departmentId !== deptId || coreLeaderIds.has(t.id));
    });

    setDepartments(prev =>
      prev.map(d => (d.id === deptId ? { ...d, memberCount: 1 } : d))
    );

    const targetDept = departments.find(d => d.id === deptId);
    const name = deptId === 'dep-bgh' || deptId === 'BGH' ? 'Ban Giám Hiệu' : targetDept?.name || 'Tổ chuyên môn';
    addToast(`Đã làm sạch danh sách giáo viên của ${name} (chỉ giữ lại cán bộ phụ trách nòng cốt)`, 'info');
  };

  const resetTeachersToCore = () => {
    setTeachers(INITIAL_TEACHERS);
    setDepartments(INITIAL_DEPARTMENTS);
    setStored('TEACHERS', INITIAL_TEACHERS);
    setStored('DEPARTMENTS', INITIAL_DEPARTMENTS);
    addToast('Đã làm sạch toàn bộ danh sách giáo viên demo. Danh sách hiện tại gồm 3 cán bộ Ban Giám Hiệu và 4 Tổ trưởng chuyên môn!', 'success');
  };

  const deleteBaoGiangEntry = (id: string) => {
    setBaoGiangList(prev => prev.filter(b => b.id !== id));
    addToast('Đã xóa tiết báo giảng', 'info');
  };

  const addWeeklyBaoGiangFile = (file: Omit<WeeklyBaoGiangFile, 'id' | 'uploadDate' | 'status'>) => {
    const newFile: WeeklyBaoGiangFile = {
      ...file,
      id: `wbg-${Date.now()}`,
      uploadDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'CHO_DUYET'
    };
    setWeeklyBaoGiangFiles(prev => [newFile, ...prev]);
    addToast(`Đã nộp Sổ báo giảng Tuần ${file.week} lên hệ thống thành công`, 'success');
  };

  const approveWeeklyBaoGiangFile = (id: string) => {
    setWeeklyBaoGiangFiles(prev =>
      prev.map(f =>
        f.id === id
          ? {
              ...f,
              status: 'DA_DUYET',
              approvedBy: `${currentUser.name} (${currentUser.position})`,
              approvalDate: new Date().toISOString().split('T')[0]
            }
          : f
      )
    );
    addToast('Đã phê duyệt Sổ báo giảng tuần của giáo viên', 'success');
  };

  const deleteWeeklyBaoGiangFile = (id: string) => {
    setWeeklyBaoGiangFiles(prev => prev.filter(f => f.id !== id));
    addToast('Đã xóa tệp sổ báo giảng tuần', 'info');
  };

  const addKeHoach = (item: Omit<KeHoachItem, 'id'>) => {
    const newItem: KeHoachItem = {
      ...item,
      id: `kh-${Date.now()}`
    };
    setKeHoachList(prev => [newItem, ...prev]);
    addToast('Đã thêm kế hoạch / hồ sơ chuyên môn', 'success');
  };

  const deleteKeHoach = (id: string) => {
    setKeHoachList(prev => prev.filter(k => k.id !== id));
    addToast('Đã xóa kế hoạch / hồ sơ chuyên môn', 'info');
  };

  const remindTeacher = (teacherId: string, recordName: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    addToast(`Đã gửi thông báo nhắc nhở nộp bổ sung "${recordName}" tới ${teacher?.name || 'giáo viên'}`, 'warning');
  };

  const resetAllData = () => {
    localStorage.clear();
    setDepartments(INITIAL_DEPARTMENTS);
    setTeachers(INITIAL_TEACHERS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setBaoGiangList(INITIAL_BAO_GIANG);
    setWeeklyBaoGiangFiles(INITIAL_WEEKLY_BAO_GIANG_FILES);
    setGiaoAnList(INITIAL_GIAO_AN);
    setKeHoachList(INITIAL_KE_HOACH);
    setRequests(INITIAL_REQUESTS);
    setNeNepList(INITIAL_NE_NEP);
    setHoSoMatrix(INITIAL_HOSO_MATRIX);
    setAcademicYearState(CURRENT_ACADEMIC_YEAR);
    setRole('BGH');
    setActiveTab('dashboard');
    addToast('Đã khôi phục dữ liệu mẫu hệ thống ban đầu', 'info');
  };

  // Google Workspace Sync Modal state & Connected Sheet
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleModalTab, setGoogleModalTab] = useState<'sheets' | 'drive' | 'github'>('sheets');
  const [connectedSheet, setConnectedSheetState] = useState<{ id: string; name: string; url: string; lastSynced?: string } | null>(() =>
    getStored('CONNECTED_SHEET', null)
  );

  const setConnectedSheet = (sheet: { id: string; name: string; url: string; lastSynced?: string } | null) => {
    setConnectedSheetState(sheet);
    setStored('CONNECTED_SHEET', sheet);
  };

  const importGiaoAnList = (newItems: GiaoAnItem[]) => {
    if (!newItems || newItems.length === 0) return;
    setGiaoAnList(prev => [...newItems, ...prev]);
    addToast(`Đã nhập thành công ${newItems.length} kế hoạch bài dạy (giáo án) từ Google Sheets!`, 'success');
  };

  const importBaoGiangList = (newItems: BaoGiangEntry[]) => {
    if (!newItems || newItems.length === 0) return;
    setBaoGiangList(prev => [...newItems, ...prev]);
    addToast(`Đã nhập thành công ${newItems.length} tiết báo giảng từ Google Sheets!`, 'success');
  };

  const openGoogleSync = (tab: 'sheets' | 'drive' | 'github' = 'sheets') => {
    setGoogleModalTab(tab);
    setIsGoogleModalOpen(true);
  };

  const closeGoogleSync = () => {
    setIsGoogleModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setRole,
        currentUser,
        setCurrentUser,
        activeTab,
        setActiveTab,
        selectedWeek,
        setSelectedWeek,
        selectedDepartment,
        setSelectedDepartment,
        searchQuery,
        setSearchQuery,
        academicYear,
        setAcademicYear,
        departments,
        teachers,
        assignments,
        baoGiangList,
        weeklyBaoGiangFiles,
        giaoAnList,
        keHoachList,
        requests,
        neNepList,
        hoSoMatrix,
        stats,
        addTeacher,
        deleteTeacher,
        deleteTeachersByDepartment,
        resetTeachersToCore,
        importTeachers,
        approveBaoGiang,
        rejectBaoGiang,
        addBaoGiangEntry,
        deleteBaoGiangEntry,
        addWeeklyBaoGiangFile,
        approveWeeklyBaoGiangFile,
        deleteWeeklyBaoGiangFile,
        approveGiaoAn,
        requestGiaoAnRevision,
        addGiaoAn,
        approveRequest,
        rejectRequest,
        createRequest,
        addAssignment,
        deleteAssignment,
        addNeNepRecord,
        addKeHoach,
        deleteKeHoach,
        remindTeacher,
        resetAllData,
        toasts,
        addToast,
        removeToast,
        isGoogleModalOpen,
        googleModalTab,
        openGoogleSync,
        closeGoogleSync,
        connectedSheet,
        setConnectedSheet,
        importGiaoAnList,
        importBaoGiangList
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
