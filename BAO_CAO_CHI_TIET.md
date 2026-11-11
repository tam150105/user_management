# BÁO CÁO GIỮA KỲ MÔN: LẬP TRÌNH ĐA NỀN TẢNG
**Đề tài:** Ứng dụng Quản lý người dùng phân hệ Admin (Web & Mobile)
- **Công nghệ:** React Native (Expo SDK 58)
- **Cơ sở dữ liệu:** Firebase Realtime Database
- **Cấu trúc trường dữ liệu (ĐÚNG 4 TRƯỜNG THEO ĐỀ BÀI):** `email`, `matkhau`, `hoten`, `hinhanh`

---

## 1. CÁC BƯỚC THỰC HIỆN VÀ LỆNH TẢI THƯ VIỆN

### Bước 1: Khởi tạo dự án
```bash
npx create-expo-app quan-ly-nguoi-dung
cd quan-ly-nguoi-dung
```

### Bước 2: Cài đặt các thư viện liên quan
1. Kết nối Firebase Realtime Database:
```bash
npm install firebase
```
2. Thư viện chọn hình ảnh từ thiết bị di động & máy tính:
```bash
npx expo install expo-image-picker
```
3. Thư viện hỗ trợ hiển thị trên nền tảng Web:
```bash
npx expo install react-dom react-native-web @expo/metro-runtime
```

### Bước 3: Lệnh khởi chạy ứng dụng
- Chạy trên nền tảng Web:
```bash
npm run web
```
- Chạy trên nền tảng Mobile (Expo Go):
```bash
npx expo start
```

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (TUYỆT ĐỐI CHỈ 4 TRƯỜNG QUY ĐỊNH)

Cơ sở dữ liệu Firebase Realtime Database tại nhánh `users` được thiết kế chỉ chứa đúng 4 trường bắt buộc, không bổ sung thêm bất kỳ trường lạ nào:
- `email`: Địa chỉ email tài khoản người dùng.
- `matkhau`: Mật khẩu tài khoản.
- `hoten`: Họ và tên người dùng.
- `hinhanh`: Chuỗi mã hóa Base64 hoặc link ảnh đại diện.

File dữ liệu `database.json`:
```json
{
  "users": {
    "user_01": {
      "email": "admin@gmail.com",
      "matkhau": "123456",
      "hoten": "Nguyễn Văn Quản Trị",
      "hinhanh": "https://i.pravatar.cc/150?img=11"
    },
    "user_02": {
      "email": "tranvanb@gmail.com",
      "matkhau": "matkhau123",
      "hoten": "Trần Văn Bình",
      "hinhanh": "https://i.pravatar.cc/150?img=12"
    }
  }
}
```

---

## 3. CÁC TÍNH NĂNG VÀ CHỨC NĂNG NÂNG CAO TRIỂN KHAI

### 3.1. Phân hệ Đăng nhập & Xác thực quyền (1.5 điểm)
- Xác thực tài khoản trực tiếp từ CSDL Firebase (`email` và `matkhau`).
- **Tích hợp kiểm tra khóa tài khoản:** Nếu tài khoản đang trong trạng thái bị Quản trị viên Khóa (Ban/Suspend), hệ thống sẽ từ chối đăng nhập và báo lỗi rõ ràng.

### 3.2. Quản lý Thêm mới & Hiển thị trên Web (8.0 điểm)
- Form nhập đầy đủ 4 trường `hoten`, `email`, `matkhau`, `hinhanh`.
- Đồng bộ danh sách theo thời gian thực (Realtime sync) qua Firebase `onValue()`.

### 3.3. CÁC TÍNH NĂNG NÂNG CAO (1.5 điểm) - THỎA MÃN KHÔNG THÊM CỘT CSDL
1. **Khóa / Mở khóa tài khoản (Ban/Suspend & Unban):**
   - Thêm nút **Khóa** cạnh nút Sửa/Xóa. Khi bấm "Khóa", tài khoản sẽ bị gạch tên, gắn nhãn `ĐÃ KHÓA`, chuyển nền đỏ nhạt và **hoàn toàn không thể đăng nhập vào hệ thống**.
   - Bấm nút **Mở** để mở khóa cho tài khoản hoạt động trở lại bình thường.
   - Cơ chế quản lý ID trong bộ nhớ State, **hoàn toàn không thêm cột lạ nào vào CSDL Firebase**.
2. **Xóa vĩnh viễn khỏi CSDL:**
   - Nút **Xóa** thực hiện xóa triệt để bản ghi khỏi Firebase Realtime Database bằng hàm `remove()`.
3. **Thao tác hàng loạt (Bulk Actions):**
   - Checkbox ở từng người dùng và nút "Chọn tất cả trang này".
   - Cho phép **"Khóa hàng loạt"** hoặc **"Xóa vĩnh viễn hàng loạt"** các tài khoản đã chọn chỉ với 1 click.
4. **Dashboard Thống kê Trực quan:**
   - Thống kê: Tổng người dùng, Số người dùng đã có ảnh, và Số tài khoản đang bị khóa.
5. **Phân trang (Pagination):**
   - Phân trang 5 người dùng/trang kèm điều hướng ‹ Trước / Sau ›.
6. **Tìm kiếm thời gian thực & Sắp xếp linh hoạt:**
   - Tìm kiếm theo Họ tên hoặc Email, sắp xếp thứ tự A → Z hoặc Z → A.
7. **Modal xem chi tiết:** Bấm vào Avatar để mở pop-up xem toàn bộ thông tin tài khoản (kèm trạng thái Hoạt động / Bị khóa).
8. **Xuất file CSDL (Export JSON):** Xuất file `database.json` chuẩn 4 trường để nộp bài.

### 3.4. Chọn hình ảnh và hiển thị trên Di động (0.5 điểm)
- Sử dụng `expo-image-picker` tích hợp trên điện thoại Android/iOS.
- **Cơ chế lưu trữ hình ảnh:** Khi người dùng chọn một bức ảnh từ điện thoại/máy tính, thư viện sẽ tự động đọc file ảnh và chuyển đổi dữ liệu nhị phân (binary) thành chuỗi ký tự văn bản **Base64** (`data:image/jpeg;base64,...`). 
- Chuỗi Base64 này được lưu trực tiếp vào trường `hinhanh` trên Firebase Realtime Database. Nhờ đó:
  - CSDL chỉ cần đúng 1 trường text `hinhanh` mà vẫn lưu được ảnh thực tế.
  - Hiển thị trực tiếp trên cả ứng dụng Di động lẫn Trình duyệt Web mà không cần cấu hình thêm dịch vụ lưu trữ phụ trợ (Firebase Storage hay Cloudinary).
