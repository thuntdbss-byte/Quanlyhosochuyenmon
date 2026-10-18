import { UserProfile, Department, TeachingAssignment } from '../types';

export function exportTeachersToCSV(
  teachers: UserProfile[],
  departments: Department[],
  assignments: TeachingAssignment[] = [],
  departmentFilter: string = 'ALL',
  academicYear: string = '2026 - 2027'
): void {
  const filteredTeachers = departmentFilter === 'ALL'
    ? teachers
    : teachers.filter(t => t.departmentId === departmentFilter);

  const deptName = departmentFilter === 'ALL'
    ? 'TOAN_TRUONG'
    : (departments.find(d => d.id === departmentFilter)?.code || 'TO_BO_MON');

  // Prepare CSV Rows with UTF-8 BOM for clean Vietnamese in Excel
  const rows: string[][] = [
    ['BỘ GIÁO DỤC VÀ ĐÀO TẠO'],
    ['TRƯỜNG DỰ BỊ ĐẠI HỌC DÂN TỘC SẦM SƠN'],
    [`DANH SÁCH CÁN BỘ - GIÁO VIÊN & ĐỊNH MỨC GIẢNG DẠY NĂM HỌC ${academicYear}`],
    ['Quy chế đào tạo: 28 tuần học thực tế'],
    ['Ngày xuất dữ liệu: ' + new Date().toLocaleDateString('vi-VN')],
    [],
    [
      'STT',
      'Mã định danh',
      'Họ và tên',
      'Tổ chuyên môn',
      'Môn giảng dạy',
      'Chức vụ / Kiêm nhiệm',
      'Lớp chủ nhiệm',
      'Định mức chuẩn (tiết/tuần)',
      'Tiết giảm trừ (tiết/tuần)',
      'Định mức thực dạy (tiết/tuần)',
      'Số tiết phân công thực tế',
      'Trạng thái định mức',
      'Các lớp phụ trách',
      'Số điện thoại',
      'Email công vụ'
    ]
  ];

  filteredTeachers.forEach((t, index) => {
    const teacherAssignments = assignments.filter(a => a.teacherId === t.id);
    const assignedPeriods = teacherAssignments.reduce((sum, a) => sum + a.periodsPerWeek, 0);
    const requiredPeriods = t.standardPeriods - t.reductionPeriods;
    const diff = assignedPeriods - requiredPeriods;
    
    let statusText = 'Đủ định mức';
    if (diff > 0) statusText = `Thừa ${diff} tiết`;
    if (diff < 0) statusText = `Thiếu ${Math.abs(diff)} tiết`;

    const classList = teacherAssignments
      .map(a => `${a.className}: ${a.periodsPerWeek}t (${a.subject})`)
      .join('; ');

    rows.push([
      (index + 1).toString(),
      t.code,
      t.name,
      t.departmentName,
      t.subject,
      t.position,
      t.homeroomClass || 'Không',
      t.standardPeriods.toString(),
      t.reductionPeriods.toString(),
      requiredPeriods.toString(),
      assignedPeriods.toString(),
      statusText,
      classList || 'Chưa phân công lớp cụ thể',
      t.phone,
      t.email
    ]);
  });

  // Add Summary section
  rows.push([]);
  rows.push(['TỔNG HỢP CƠ CẤU NHÂN SỰ CHUYÊN MÔN:']);
  rows.push([`Tổng số cán bộ, giáo viên: ${filteredTeachers.length} đồng chí`]);
  departments.forEach(d => {
    const count = teachers.filter(t => t.departmentId === d.id).length;
    rows.push([`${d.name}: ${count} giáo viên (Tổ trưởng: ${d.leaderName} - ${d.subjects.join(', ')})`]);
  });

  // Convert to CSV String with UTF-8 BOM
  const csvContent = '\uFEFF' + rows.map(r => 
    r.map(cell => {
      const escaped = (cell || '').replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',')
  ).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const fileName = `DS_Giao_Vien_Truong_Du_Bi_DH_Dan_Toc_Sam_Son_${deptName}_28Tuan.csv`;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Tải file mẫu CSV danh sách cán bộ, giáo viên chuẩn hóa theo từng tổ chuyên môn hoặc toàn trường
 */
export function downloadTeacherTemplateCSV(departmentId?: string, departments?: Department[]): void {
  let fileName = 'Mau_Danh_Sach_Giao_Vien_Truong_DBSS.csv';
  let targetDeptName = 'Tất cả các tổ';
  let sampleRows: string[][] = [];

  const headers = ['Mã GV', 'Họ và tên', 'Tổ chuyên môn', 'Môn giảng dạy', 'Chức vụ', 'Lớp chủ nhiệm', 'Định mức chuẩn', 'Tiết giảm trừ', 'Số điện thoại', 'Email công vụ'];

  if (departmentId === 'dep-toan-tin') {
    fileName = 'Mau_DS_GiaoVien_To_Toan_Tin.csv';
    targetDeptName = 'Tổ Toán - Tin';
    sampleRows = [
      ['GV-TT02', 'Cô Mai Thị Tuyết Mai', 'Tổ Toán - Tin', 'Toán học', 'Tổ phó Chuyên môn', 'DB-A2', '19', '5', '0978112334', 'tuyetmai.toan@dbss.edu.vn'],
      ['GV-TT03', 'Cô Lê Thị Lan', 'Tổ Toán - Tin', 'Toán học', 'Giáo viên bộ môn', '', '19', '0', '0915223445', 'lanlt.toan@dbss.edu.vn'],
      ['GV-TT04', 'Thầy Phạm Quốc Anh', 'Tổ Toán - Tin', 'Tin học', 'Giáo viên bộ môn', 'DB-A3', '19', '4', '0936334556', 'anhpq.tin@dbss.edu.vn'],
      ['GV-TT05', 'Cô Trần Thùy Dung', 'Tổ Toán - Tin', 'Toán học', 'Giáo viên bộ môn', '', '19', '0', '0968445667', 'dungtt.toan@dbss.edu.vn']
    ];
  } else if (departmentId === 'dep-van-nn') {
    fileName = 'Mau_DS_GiaoVien_To_Van_NgoaiNgu.csv';
    targetDeptName = 'Tổ Ngữ Văn - Ngoại Ngữ';
    sampleRows = [
      ['GV-VNN02', 'Cô Bùi Thị Dung', 'Tổ Ngữ Văn - Ngoại Ngữ', 'Ngữ văn', 'Tổ phó Chuyên môn', 'DB-D2', '19', '5', '0945556778', 'dungbt.van@dbss.edu.vn'],
      ['GV-VNN03', 'Cô Hoàng Bích Ngọc', 'Tổ Ngữ Văn - Ngoại Ngữ', 'Tiếng Anh', 'Giáo viên bộ môn', '', '19', '0', '0912667889', 'ngochb.anh@dbss.edu.vn'],
      ['GV-VNN04', 'Cô Đặng Minh Châu', 'Tổ Ngữ Văn - Ngoại Ngữ', 'Tiếng Anh', 'Giáo viên bộ môn', 'DB-D3', '19', '4', '0973778990', 'chaudm.anh@dbss.edu.vn'],
      ['GV-VNN05', 'Thầy Lương Thế Vinh', 'Tổ Ngữ Văn - Ngoại Ngữ', 'Ngữ văn', 'Giáo viên bộ môn', '', '19', '0', '0984889001', 'vinhlt.van@dbss.edu.vn']
    ];
  } else if (departmentId === 'dep-tu-nhien') {
    fileName = 'Mau_DS_GiaoVien_To_Tu_Nhien.csv';
    targetDeptName = 'Tổ Tự nhiên';
    sampleRows = [
      ['GV-TN02', 'Cô Đặng Thị Phúc', 'Tổ Tự nhiên', 'Vật lý', 'Tổ phó Chuyên môn', 'DB-B2', '19', '5', '0934990112', 'phucdt.ly@dbss.edu.vn'],
      ['GV-TN03', 'Thầy Lê Văn Nguyên', 'Tổ Tự nhiên', 'Hóa học', 'Tổ phó Chuyên môn', 'DB-B3', '19', '5', '0965112223', 'nguyenlv.hoa@dbss.edu.vn'],
      ['GV-TN04', 'Thầy Bùi Quang Huy', 'Tổ Tự nhiên', 'Vật lý', 'Giáo viên bộ môn', '', '19', '0', '0918223334', 'huybq.ly@dbss.edu.vn'],
      ['GV-TN05', 'Cô Ngô Phương Thảo', 'Tổ Tự nhiên', 'Sinh học', 'Giáo viên bộ môn', '', '19', '0', '0976334445', 'thaonp.sinh@dbss.edu.vn'],
      ['GV-TN06', 'Cô Phạm Thị Yến', 'Tổ Tự nhiên', 'Hóa học', 'Giáo viên bộ môn', '', '19', '0', '0918445556', 'yenpt.hoa@dbss.edu.vn']
    ];
  } else if (departmentId === 'dep-xa-hoi') {
    fileName = 'Mau_DS_GiaoVien_To_Xa_Hoi.csv';
    targetDeptName = 'Tổ Xã hội';
    sampleRows = [
      ['GV-XH02', 'Cô Lê Thị Lan Hương', 'Tổ Xã hội', 'Địa lý', 'Tổ phó Chuyên môn', 'DB-C1', '19', '5', '0908445556', 'huongltl.dia@dbss.edu.vn'],
      ['GV-XH03', 'Cô Chu Thị Nga', 'Tổ Xã hội', 'Giáo dục KT&PL', 'Giáo viên bộ môn', 'DB-C2', '19', '4', '0942556667', 'ngact.ktpl@dbss.edu.vn'],
      ['GV-XH04', 'Thầy Hoàng Văn Cường', 'Tổ Xã hội', 'Lịch sử', 'Giáo viên bộ môn', '', '19', '0', '0981667778', 'cuonghv.su@dbss.edu.vn'],
      ['GV-XH05', 'Cô Nguyễn Minh Hạnh', 'Tổ Xã hội', 'Địa lý', 'Giáo viên bộ môn', '', '19', '0', '0934556677', 'hanhnm.dia@dbss.edu.vn']
    ];
  } else if (departmentId === 'dep-bgh' || departmentId === 'BGH') {
    fileName = 'Mau_DS_Ban_Giam_Hieu.csv';
    targetDeptName = 'Ban Giám Hiệu';
    sampleRows = [
      ['BGH-01', 'TS. Lê Lâm', 'Ban Giám Hiệu', 'Quản lý Giáo dục', 'Hiệu trưởng nhà trường', '', '2', '0', '0912.345.888', 'lelam.bgh@dbss.edu.vn'],
      ['BGH-02', 'TS. Trịnh Thị Hoa', 'Ban Giám Hiệu', 'Ngữ văn', 'Phó Hiệu trưởng nhà trường', '', '4', '0', '0904.567.890', 'trinhthihoa.bgh@dbss.edu.vn'],
      ['BGH-03', 'TS. Lê Văn Sơn', 'Ban Giám Hiệu', 'Lịch sử', 'Phó Hiệu trưởng nhà trường', '', '4', '0', '0913.678.999', 'levanson.bgh@dbss.edu.vn']
    ];
  } else {
    // General template across departments
    sampleRows = [
      ['GV-TT02', 'Cô Mai Thị Tuyết Mai', 'Tổ Toán - Tin', 'Toán học', 'Tổ phó Chuyên môn', 'DB-A2', '19', '5', '0978112334', 'tuyetmai.toan@dbss.edu.vn'],
      ['GV-VNN02', 'Cô Bùi Thị Dung', 'Tổ Ngữ Văn - Ngoại Ngữ', 'Ngữ văn', 'Tổ phó Chuyên môn', 'DB-D2', '19', '5', '0945556778', 'dungbt.van@dbss.edu.vn'],
      ['GV-TN02', 'Cô Đặng Thị Phúc', 'Tổ Tự nhiên', 'Vật lý', 'Tổ phó Chuyên môn', 'DB-B2', '19', '5', '0934990112', 'phucdt.ly@dbss.edu.vn'],
      ['GV-TN03', 'Thầy Lê Văn Nguyên', 'Tổ Tự nhiên', 'Hóa học', 'Tổ phó Chuyên môn', 'DB-B3', '19', '5', '0965112223', 'nguyenlv.hoa@dbss.edu.vn'],
      ['GV-XH02', 'Cô Lê Thị Lan Hương', 'Tổ Xã hội', 'Địa lý', 'Tổ phó Chuyên môn', 'DB-C1', '19', '5', '0908445556', 'huongltl.dia@dbss.edu.vn']
    ];
  }

  const allRows = [headers, ...sampleRows];

  const csvContent = '\uFEFF' + allRows.map(r =>
    r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Phân tích file CSV giáo viên và chuyển đổi sang UserProfile[]
 * Có hỗ trợ cưỡng chế/chỉ định Tổ chuyên môn cụ thể (forcedDepartmentId) khi tải theo từng tổ
 */
export function parseTeacherCSV(
  csvText: string,
  departments: Department[],
  forcedDepartmentId?: string
): { success: boolean; data: UserProfile[]; errors: string[] } {
  const errors: string[] = [];
  const results: UserProfile[] = [];

  const lines = csvText.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    return { success: false, data: [], errors: ['File CSV trống hoặc không có dòng dữ liệu hợp lệ'] };
  }

  // Helper to split CSV line safely with quotes
  const parseLine = (text: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  // Find header index
  let headerIndex = -1;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('họ và tên') || lower.includes('họ tên') || lower.includes('tên giáo viên')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    // If no header with "Họ và tên", assume line 0 is header
    headerIndex = 0;
  }

  const header = parseLine(lines[headerIndex]).map(h => h.toLowerCase().replace(/["\ufeff]/g, '').trim());

  const colName = header.findIndex(h => h.includes('tên') || h.includes('họ'));
  const colCode = header.findIndex(h => h.includes('mã'));
  const colDept = header.findIndex(h => h.includes('tổ') || h.includes('phòng') || h.includes('khoa') || h.includes('đơn vị'));
  const colSubject = header.findIndex(h => h.includes('môn') || h.includes('bộ môn') || h.includes('lĩnh vực'));
  const colPosition = header.findIndex(h => h.includes('chức vụ') || h.includes('vị trí'));
  const colHomeroom = header.findIndex(h => h.includes('chủ nhiệm') || h.includes('lớp'));
  const colStandard = header.findIndex(h => h.includes('định mức') && !h.includes('thực') && !h.includes('giảm'));
  const colReduction = header.findIndex(h => h.includes('giảm') || h.includes('trừ'));
  const colPhone = header.findIndex(h => h.includes('thoại') || h.includes('sđt') || h.includes('phone') || h.includes('liên hệ'));
  const colEmail = header.findIndex(h => h.includes('email') || h.includes('thư') || h.includes('mail'));

  // Pre-find forced department if any
  const forcedDeptObj = forcedDepartmentId && forcedDepartmentId !== 'ALL'
    ? (forcedDepartmentId === 'dep-bgh' || forcedDepartmentId === 'BGH'
        ? { id: 'dep-bgh', name: 'Ban Giám Hiệu' }
        : departments.find(d => d.id === forcedDepartmentId))
    : null;

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine || rawLine.startsWith('TỔNG HỢP') || rawLine.startsWith('BỘ GIÁO DỤC') || rawLine.startsWith('TRƯỜNG DỰ BỊ')) {
      continue;
    }

    const cols = parseLine(rawLine);
    if (cols.length < 2) continue;

    const name = colName >= 0 ? cols[colName] : cols[1] || '';
    if (!name || name.length < 2) continue;

    const code = colCode >= 0 && cols[colCode] ? cols[colCode] : `GV-${Date.now().toString().slice(-4)}${i}`;
    let deptStr = colDept >= 0 && cols[colDept] ? cols[colDept] : '';
    const subject = colSubject >= 0 && cols[colSubject] ? cols[colSubject] : 'Chưa phân';
    const position = colPosition >= 0 && cols[colPosition] ? cols[colPosition] : 'Giáo viên bộ môn';
    const homeroom = colHomeroom >= 0 && cols[colHomeroom] ? cols[colHomeroom] : undefined;
    const standardPeriods = colStandard >= 0 && cols[colStandard] ? (parseInt(cols[colStandard], 10) || 19) : 19;
    const reductionPeriods = colReduction >= 0 && cols[colReduction] ? (parseInt(cols[colReduction], 10) || 0) : 0;
    const phone = colPhone >= 0 && cols[colPhone] ? cols[colPhone] : '09' + Math.floor(10000000 + Math.random() * 90000000);
    const email = colEmail >= 0 && cols[colEmail] ? cols[colEmail] : `gv.${code.toLowerCase()}@dbss.edu.vn`;

    let role: 'BGH' | 'TO_TRUONG' | 'GIAO_VIEN' = 'GIAO_VIEN';
    let deptId = 'dep-toan-tin';
    let deptName = 'Tổ Toán - Tin';

    // If forcedDeptObj is set, prioritize it unless row explicitly specifies BGH
    if (forcedDeptObj) {
      deptId = forcedDeptObj.id;
      deptName = forcedDeptObj.name;
      if (deptId === 'dep-bgh' || deptName.includes('Ban Giám Hiệu')) {
        role = 'BGH';
      }
    } else {
      // Match from CSV column
      const matchedDept = departments.find(d => 
        d.name.toLowerCase().includes(deptStr.toLowerCase()) || 
        deptStr.toLowerCase().includes(d.code.toLowerCase()) ||
        d.id.toLowerCase().includes(deptStr.toLowerCase())
      );
      if (matchedDept) {
        deptId = matchedDept.id;
        deptName = matchedDept.name;
      }
    }

    if (
      position.toLowerCase().includes('hiệu trưởng') ||
      position.toLowerCase().includes('hiệu phó') ||
      deptStr.toLowerCase().includes('ban giám hiệu') ||
      deptStr.toLowerCase().includes('bgh')
    ) {
      role = 'BGH';
      deptId = 'dep-bgh';
      deptName = 'Ban Giám Hiệu';
    } else if (position.toLowerCase().includes('tổ trưởng')) {
      role = 'TO_TRUONG';
    }

    const newTeacher: UserProfile = {
      id: `gv-imp-${Date.now()}-${i}`,
      name,
      code,
      role,
      departmentId: deptId,
      departmentName: deptName,
      subject,
      homeroomClass: homeroom || undefined,
      phone,
      email,
      position,
      standardPeriods,
      reductionPeriods,
      actualPeriods: 0,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + (i % 20)}?w=120&auto=format&fit=crop&q=80`
    };

    results.push(newTeacher);
  }

  return {
    success: results.length > 0,
    data: results,
    errors
  };
}
