# 📋 TÀI LIỆU ĐẶC TẢ KỸ THUẬT VÀ YÊU CẦU CHỨC NĂNG HỆ THỐNG
## (TTS Profile & Master Document Automation System)

---

## 📌 I. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)
Hệ thống là giải pháp **tự động hóa quản lý hồ sơ ứng viên Thực tập sinh (TTS) & Kỹ năng đặc định Nhật Bản**, giải quyết bài toán cốt lõi:
- **Tập trung hóa dữ liệu**: Quy tụ mọi thông tin ứng viên từ các file phân tán về **1 File Master duy nhất (Chuẩn 60 cột)**.
- **Quy trình 2 chiều**: **(1) Nhập / Đồng bộ qua Google Sheet** ➡️ **(2) Lưu trữ / Backup ra File Excel Master (.xlsx)**.
- **Tự động sinh hồ sơ chuẩn Nhật**: Sinh tự động Sơ yếu lý lịch OTIT Mẫu 1-3 (`参考様式第１-３号`), Khai TT Cục XNC (`TCMMXD`), Xuất ZIP hàng loạt.

---

## 🖥️ II. KIẾN TRÚC FRONTEND (FE ARCHITECTURE)

### 1. Công nghệ sử dụng
- **Core Framework**: React 18+ (TypeScript), Vite Bundler.
- **Giao diện & UI System**: Tailwind CSS (Thiết kế phong cách Neo-brutalism hiện đại, đường viền tương phản cao, tối ưu hiển thị mật độ dữ liệu lớn).
- **Icons**: `lucide-react`.
- **Thư viện xử lý Excel & Tệp**:
  - `xlsx` / SheetJS: Đọc/ghi và parse file Excel client-side & server-side.
  - `jszip` & `file-saver`: Đóng gói file hồ sơ nộp Cục và tải ZIP hàng loạt.

### 2. Các Phân Hệ Màn Hình Chính (Modules & Views)

| Tên Phân Hệ | Mô Tả Chức Năng |
| :--- | :--- |
| **Header Navigation & Quick Action** | Thanh công cụ cố định: Chuyển đổi tab, nút **"1. Nhập Google Sheet"**, **"2. Lưu Master Excel (.xlsx)"**, **"Xuất ZIP Hàng Loạt"**, phím tắt `⌘K`. |
| **Bảng Excel Master (60 Cột)** | Bảng tính tương tác đa năng hiển thị đầy đủ 60 cột thông tin: Lọc theo Nghiệp đoàn / Công ty tiếp nhận, tìm kiếm theo tên/mã/CCCD, sửa nhanh tại dòng, thêm mới hàng, phân trang thông minh. |
| **Danh Sách Ứng Viên (Card / Table View)** | Quản lý danh sách hồ sơ chi tiết, trạng thái tiến độ (Mới tạo, Chờ phỏng vấn, Đỗ đơn hàng, Đang làm hồ sơ Cục, Đã có tư cách lưu trú COE). |
| **Màn Hình Thêm & Chỉnh Sửa Hồ Sơ** | Form nhập liệu chi tiết phân tab khoa học: Thông tin cá nhân, Hộ chiếu/CCCD, Quá trình học tập (Cấp 1 - Cấp 3), Lịch sử làm việc, Người bảo lãnh/Gia đình, Nguyện vọng & Phỏng vấn. |
| **Modal Tham Khảo Mẫu 1-3 (OTIT 1-3)** | Trình xem trước & in ấn biểu mẫu Sơ yếu lý lịch chuẩn Nhật Bản (`参考様式第１-３号`) tự động mapping từ Master. |
| **Modal Quản Lý Biểu Mẫu (Template Manager)** | Cấu hình và quản lý các template Word / Excel biểu mẫu nộp các Nghiệp đoàn và Cục XNC khác nhau. |
| **Modal Hướng Dẫn Phím Tắt (Power User)** | Trợ giúp phím tắt toàn cục (`⌘1` - `⌘4`, `⌘N`, `⌘B`, `⌘I`, `⌘K`, `Esc`). |

---

## 🗄️ III. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Cơ sở dữ liệu được thiết kế dạng **Bảng Quan Hệ Chuẩn Hóa** kết hợp với **Bảng Ánh Xạ Master 60 Cột**.

### 1. Bảng `candidates` (Thông tin cốt lõi)
```sql
CREATE TABLE candidates (
  id VARCHAR(36) PRIMARY KEY,              -- Mã định danh duy nhất (UUID)
  candidate_code VARCHAR(50) UNIQUE,       -- Mã quản lý TTS (VD: TTS-2025-001)
  full_name_vi VARCHAR(100) NOT NULL,      -- Họ tên tiếng Việt có dấu (NGUYEN VAN A)
  full_name_furigana VARCHAR(100),         -- Tên Katakana (グエン ヴァン アー)
  full_name_kanji VARCHAR(100),            -- Tên chữ Hán (nếu có)
  gender VARCHAR(10),                      -- Giới tính (Nam / Nữ)
  dob DATE NOT NULL,                       -- Ngày sinh (YYYY-MM-DD)
  phone_number VARCHAR(20),                -- Số điện thoại
  email VARCHAR(100),                      -- Email cá nhân
  avatar_url TEXT,                         -- Ảnh 3x4 / 4x6
  marital_status VARCHAR(20),              -- Tình trạng hôn nhân
  id_card_no VARCHAR(20) UNIQUE,           -- Số CCCD (12 số)
  id_card_date DATE,                       -- Ngày cấp CCCD
  id_card_place VARCHAR(100),              -- Nơi cấp CCCD
  passport_no VARCHAR(20),                 -- Số hộ chiếu
  passport_date DATE,                      -- Ngày cấp hộ chiếu
  passport_expiry DATE,                    -- Ngày hết hạn hộ chiếu
  permanent_address TEXT,                  -- Địa chỉ hộ khẩu thường trú
  contact_address TEXT,                    -- Địa chỉ liên lạc hiện tại
  height_cm DECIMAL(5,1),                  -- Chiều cao (cm)
  weight_kg DECIMAL(5,1),                  -- Cân nặng (kg)
  blood_type VARCHAR(5),                   -- Nhóm máu (A, B, O, AB)
  dominant_hand VARCHAR(10),               -- Tay thuận (Trái / Phải)
  smoke_drink_history VARCHAR(100),        -- Hút thuốc / Uống rượu
  tattoo VARCHAR(50),                      -- Tình trạng hình xăm
  japanese_level VARCHAR(20),              -- Trình độ tiếng Nhật (N5, N4, N3,...)
  status VARCHAR(30) DEFAULT 'ACTIVE',     -- Trạng thái xử lý hồ sơ
  syndicate_id VARCHAR(36),                -- FK: Nghiệp đoàn tiếp nhận
  company_id VARCHAR(36),                  -- FK: Công ty tiếp nhận
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE education_history (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) REFERENCES candidates(id) ON DELETE CASCADE,
  school_level VARCHAR(50),                -- Tiểu học / THCS / THPT / Trung cấp / ĐH
  school_name VARCHAR(150),                -- Tên trường
  school_name_jp VARCHAR(150),             -- Tên trường dịch tiếng Nhật
  start_date DATE,                         -- Thời gian nhập học (YYYY-MM)
  end_date DATE,                           -- Thời gian tốt nghiệp (YYYY-MM)
  status VARCHAR(20)                       -- Đã tốt nghiệp / Thôi học
);
CREATE TABLE family_members (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) REFERENCES candidates(id) ON DELETE CASCADE,
  relationship VARCHAR(50),                -- Bố, Mẹ, Vợ, Chồng, Con, Anh/Chị/Em
  full_name VARCHAR(100),                  -- Họ và tên
  full_name_jp VARCHAR(100),               -- Họ tên Furigana
  dob DATE,                                -- Ngày tháng năm sinh
  job VARCHAR(100),                        -- Nghề nghiệp
  current_address TEXT,                    -- Nơi cư trú
  is_guarantor BOOLEAN DEFAULT FALSE       -- Có phải người bảo lãnh không
);

CREATE TABLE work_history (
  id VARCHAR(36) PRIMARY KEY,
  candidate_id VARCHAR(36) REFERENCES candidates(id) ON DELETE CASCADE,
  company_name VARCHAR(150),               -- Tên công ty làm việc
  company_name_jp VARCHAR(150),            -- Tên công ty dịch tiếng Nhật
  job_description TEXT,                    -- Nội dung công việc chi tiết
  start_date DATE,                         -- Bắt đầu (YYYY-MM)
  end_date DATE                            -- Kết thúc (YYYY-MM)
);
5. Cấu Trúc Master 60 Cột (Excel Flat Mapping View)
Tương ứng trực tiếp với file TTS_Master_Dashboard.xlsx:
Nhóm Nhận dạng (Cột 1–10): STT, Mã TTS, Họ tên Việt, Tên Katakana, Tên Kanji, Giới tính, Ngày sinh, Tuổi, Nhóm máu, Tình trạng hôn nhân.
Nhóm Giấy tờ (Cột 11–18): CCCD số, Ngày cấp, Nơi cấp, Hộ chiếu số, Ngày cấp, Hạn hộ chiếu, Hộ khẩu thường trú, Quê quán.
Nhóm Học vấn 3 Cấp (Cột 19–27): Năm vào/ra & Tên trường Tiểu học, THCS, THPT.
Nhóm Làm việc (Cột 28–35): 3 mốc công ty & nội dung công việc tại Việt Nam.
Nhóm Gia đình (Cột 36–45): Bố, Mẹ, Vợ/Chồng, Con cái (Họ tên, Năm sinh, Nghề nghiệp).
Nhóm Phái cử & Tiếp nhận (Cột 46–60): Nghiệp đoàn (Kumiai), Công ty tiếp nhận, Ngành nghề, Địa điểm làm việc bên Nhật, Ngày trúng tuyển, Dự kiến bay.
⚙️ IV. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)
1. Phân Hệ Quản Lý Dữ Liệu Master (Data Hub)
FR-01: Nhập dữ liệu từ Google Sheets (Import & Staging)
Cho phép người dùng kết nối link Google Sheet công khai hoặc link chia sẻ.
Tự động nhận diện dòng tiêu đề (Header row) và gợi ý ánh xạ tự động (Auto Column Mapping) sang 60 cột chuẩn.
Cung cấp màn hình Xem trước & Đối chiếu (Staging Review) trước khi nạp vào DB.
FR-02: Xuất và Sao lưu File Excel Master (.xlsx)
Xuất 1 click toàn bộ kho dữ liệu ứng viên ra định dạng file Excel .xlsx chuẩn 60 cột.
Định dạng chuẩn ngày tháng Nhật Bản (YYYY年MM月DD日 hoặc YYYY/MM/DD).
FR-03: Chỉnh sửa trực tiếp tại dòng (Inline/Modal Edit)
Cho phép người quản lý sửa đổi thông tin của từng ứng viên ngay trên Bảng Master mà không làm sai lệch format.
2. Phân Hệ Tự Động Sinh Biểu Mẫu Cục & OTIT
FR-04: Sinh Sơ yếu lý lịch Mẫu 1-3 (参考様式第１-３号)
Tự động bốc toàn bộ lịch sử học vấn, làm việc, gia đình từ bảng Master vào form biểu mẫu chuẩn của OTIT.
Hỗ trợ xem trước trực quan và in trực tiếp (Window Print) hoặc xuất file.
FR-05: Trích xuất Bảng Khai TT Cục (TCMMXD)
Tự động định dạng các trường thông tin theo đúng chuẩn yêu cầu của Cục Quản lý Xuất nhập cảnh Nhật Bản.
FR-06: Xuất ZIP Hàng Loạt (Batch Export Engine)
Chọn nhiều ứng viên hoặc chọn tất cả để tải về 1 file nén .zip chứa đầy đủ các file hồ sơ riêng biệt theo cấu trúc thư mục: [Mã TTS]_[Họ Tên]/....
3. Phân Hệ Trợ Năng Cho Cán Bộ Hồ Sơ (Power User Features)
FR-07: Bộ Phím Tắt Toàn Cục (Global Shortcuts)
⌘1 / Ctrl+1: Mở ngay Bảng Excel Master.
⌘2 / Ctrl+2: Mở Danh Sách Hồ Sơ.
⌘3 / Ctrl+3: Mở Màn hình Thêm Ứng Viên Mới.
⌘4 / Ctrl+4: Mở Quản lý Biểu Mẫu.
⌘I / Ctrl+I: Mở hộp thoại Nhập Google Sheet.
⌘B / Ctrl+B: Mở hộp thoại Xuất ZIP Hàng Loạt.
⌘K / Ctrl+K: Bật/Tắt bảng tra cứu phím tắt.
Esc: Đóng nhanh tất cả các cửa sổ Popup/Modal đang mở.
🔒 V. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)
Hiệu năng (Performance): Tải và hiển thị mượt mà bảng tính Master với quy mô từ 500 - 2,000 ứng viên đồng thời.
Bảo mật dữ liệu (Data Privacy): Thông tin cá nhân (CCCD, Hộ chiếu, Địa chỉ) được quản lý an toàn, hỗ trợ backup file định kỳ.
Độ chính xác nghiệp vụ: Đảm bảo không bị lệch cột, không sai định dạng Katakana/Kanji khi xuất khẩu dữ liệu sang các cơ quan Nhật Bản.