# Hệ Thống Quản Lý Hồ Sơ Chuyên Môn - Trường Dự Bị Đại Học Dân Tộc Sầm Sơn

Hệ thống số hóa và quản trị hồ sơ chuyên môn toàn diện dành cho Ban Giám hiệu, Tổ trưởng Chuyên môn, Tổ phó và Giáo viên các bộ môn, tuân thủ theo tiêu chuẩn của **Bộ Giáo dục và Đào tạo** (Công văn 5512/BGDĐT, Thông tư 28/2009/TT-BGDĐT, Thông tư 15/2017/TT-BGDĐT).

Tích hợp trực tiếp với **Google Workspace (Google Sheets & Google Drive)** cho phép xuất nhập bảng tính, quản lý định mức giảng dạy và sao lưu đám mây thời gian thực.

---

## 🚀 Các Tính Năng Chính

1. **Quản lý Tổ chuyên môn & Nhân sự:**
   - Quản lý danh sách Tổ trưởng, Tổ phó chuyên môn và các giáo viên bộ môn.
   - Tính toán tự động định mức giảng dạy (Thực dạy, Giảm trừ chức vụ/kiêm nhiệm, Định mức chuẩn, Thừa/Thiếu tiết).
   - Xuất nhập danh sách cán bộ, giáo viên qua tệp Excel/CSV chuẩn mẫu.

2. **Kế hoạch bài dạy (KHBD) & Giáo án:**
   - Quản lý tiến độ nộp và phê duyệt giáo án theo tuần/học kỳ.
   - Kiểm tra chuẩn cấu trúc 4 hoạt động của Công văn 5512/BGDĐT (Mở đầu, Hình thành kiến thức, Luyện tập, Vận dụng).
   - Thẩm định, duyệt giáo án và gửi nhận xét phản hồi trực tuyến.

3. **Sổ Báo Giảng Điện Tử:**
   - Lập và theo dõi lịch báo giảng từng tuần, thứ, tiết, lớp, môn và tên bài dạy.
   - Kiểm soát tính trùng lặp và tiến độ phân phối chương trình.

4. **Nề nếp, Dự giờ & Nghỉ dạy thay:**
   - Quản lý phiếu đánh giá dự giờ, biên bản kiểm tra chuyên môn.
   - Quản lý đơn xin nghỉ dạy, bố trí giáo viên dạy thay hoặc dạy bù.

5. **Kết Nối Google Sheets & Google Drive:**
   - **Đồng bộ Google Sheets**: Xuất danh sách giáo viên & định mức, hồ sơ giáo án KHBD, sổ báo giảng hoặc Workbook tổng hợp 4 sheet trực tiếp lên Google Drive của tài khoản Google cá nhân.
   - **Đọc dữ liệu Google Sheet**: Đọc và xem trước dữ liệu từ liên kết bảng tính Google Sheet (cả liên kết chia sẻ công khai lẫn qua quyền OAuth).
   - **Lưu trữ Google Drive**: Tự động tạo thư mục chuyên môn và sao lưu snapshot dữ liệu hệ thống lên Google Drive.

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Trên Máy Cục Bộ (Localhost)

### 1. Yêu cầu môi trường
- **Node.js** >= 18.x
- **npm** >= 9.x hoặc **bun** / **yarn**

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo tệp `.env` từ `.env.example`:
```bash
cp .env.example .env
```
*(Tệp `firebase-applet-config.json` đã được đính kèm sẵn trong mã nguồn chứa các tham số OAuth và Firebase sẵn sàng chạy).*

### 4. Khởi chạy máy chủ phát triển
```bash
npm run dev
```
Mở trình duyệt tại: **http://localhost:3000** (hoặc port do Vite thông báo).

### 5. Xây dựng phiên bản phát hành (Production Build)
```bash
npm run build
npm run preview
```

---

## 📦 Hướng Dẫn Đẩy Mã Nguồn Lên GitHub

Thực hiện các lệnh sau trong thư mục dự án:

```bash
# 1. Khởi tạo kho lưu trữ git
git init

# 2. Thêm toàn bộ tệp vào vùng chờ
git add .

# 3. Tạo commit đầu tiên
git commit -m "feat: he thong quan ly ho so chuyen mon DBSS voi ket noi Google Sheets va Drive"

# 4. Đặt tên nhánh chính là main
git branch -M main

# 5. Gắn liên kết tới kho lưu trữ GitHub của bạn
# (Thay thế <USERNAME> và <REPO_NAME> bằng tài khoản và tên kho của bạn trên GitHub)
git remote add origin https://github.com/<USERNAME>/<REPO_NAME>.git

# 6. Đẩy mã nguồn lên GitHub
git push -u origin main
```

---

## 🔑 Cấu Hình Google Cloud Console (Để Google Sheets & Drive Hoạt Động Khi Triển Khai)

Nếu bạn chạy trên máy cá nhân (`localhost:3000`) hoặc triển khai lên Vercel / GitHub Pages / Cloud Run:

1. **Bật các Google APIs:**
   - Truy cập [Google Cloud Console](https://console.cloud.google.com/).
   - Chọn dự án của bạn (hoặc dự án `gen-lang-client-0063576688`).
   - Vào mục **APIs & Services** > **Library**:
     - Tìm và Bật **Google Sheets API**.
     - Tìm và Bật **Google Drive API**.

2. **Cấu hình Nguồn gốc JavaScript được phép (Authorized JavaScript Origins):**
   - Vào **APIs & Services** > **Credentials**.
   - Nhấp vào OAuth 2.0 Client ID của bạn.
   - Thêm vào mục **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:5173`
     - Tên miền triển khai thực tế của bạn (ví dụ: `https://your-domain.vercel.app` hoặc URL Cloud Run).

3. **Cấu hình Authorized Domains trong Firebase Console:**
   - Vào [Firebase Console](https://console.firebase.google.com/).
   - Chọn dự án của bạn > **Authentication** > **Settings** > **Authorized domains**.
   - Bấm **Add domain** và thêm tên miền của ứng dụng (hoặc `localhost`).

4. **Trường hợp Trình duyệt chặn Popup:**
   - Hệ thống cung cấp sẵn nút **"Dự phòng GIS"** (sử dụng thư viện Google Identity Services token client) và **"Nhập Access Token thủ công"** trong bảng điều khiển Google Sync Modal để kết nối mọi lúc ngay cả khi popup bị chặn.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
├── firebase-applet-config.json    # Cấu hình Firebase & Google OAuth Client
├── index.html                     # HTML Entry point + Google Identity Services script
├── package.json                   # Danh sách thư viện phụ thuộc
├── tsconfig.json                  # Cấu hình TypeScript
├── vite.config.ts                 # Cấu hình Vite & Tailwind CSS
├── src/
│   ├── main.tsx                   # Điểm khởi chạy React
│   ├── App.tsx                    # Layout chính và các modal
│   ├── types.ts                   # Định nghĩa dữ liệu (Giáo viên, KHBD, Báo giảng...)
│   ├── context/
│   │   └── AppContext.tsx         # Quản trị State toàn cục và đồng bộ LocalStorage
│   ├── services/
│   │   └── googleWorkspace.ts     # Tích hợp Google Sheets API v4, Drive API v3 & OAuth
│   ├── components/
│   │   ├── Header.tsx             # Thanh điều hướng trên cùng, chuyển đổi vai trò
│   │   ├── Sidebar.tsx            # Menu chức năng chuyên môn
│   │   ├── GoogleSyncModal.tsx    # Bảng đồng bộ Google Sheets, Drive & hướng dẫn GitHub
│   │   └── views/
│   │       ├── DashboardView.tsx          # Bàn làm việc & Thống kê tổng quan
│   │       ├── DepartmentsView.tsx        # Danh sách Tổ chuyên môn & Giáo viên
│   │       ├── TeachingAssignmentView.tsx # Phân công giảng dạy & Định mức
│   │       ├── KeHoachView.tsx            # Kế hoạch công tác tuần/tháng
│   │       ├── GiaoAnView.tsx             # Quản lý Kế hoạch bài dạy & Giáo án CV 5512
│   │       ├── BaoGiangView.tsx           # Sổ báo giảng điện tử
│   │       ├── NeNepDuGioView.tsx         # Theo dõi nề nếp & Phiếu dự giờ
│   │       ├── NghiDayDayThayView.tsx     # Quản lý nghỉ dạy, dạy thay, dạy bù
│   │       ├── HoSoMatrixView.tsx         # Ma trận hồ sơ chuyên môn tổng hợp
│   │       └── ReportsView.tsx            # Báo cáo thống kê chuyên môn
│   └── utils/
│       └── exportTeachers.ts      # Tiện ích xuất nhập CSV/Excel cán bộ giáo viên
```

---

## 📜 Giấy Phép & Bản Quyền

Hệ thống được phát triển phục vụ công tác chuyển đổi số quản lý chuyên môn tại **Trường Dự bị Đại học Dân tộc Sầm Sơn**.
Tuân thủ đầy đủ các hướng dẫn của Bộ Giáo dục và Đào tạo Việt Nam.
