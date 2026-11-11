# 📱 Ứng Dụng Quản Lý Người Dùng Đa Nền Tảng (User Management System)

Hệ thống quản lý người dùng hiện đại, chạy mượt mà trên cả **Web** và **Mobile (Android/iOS)**, xây dựng với **React Native (Expo)** và đồng bộ dữ liệu thời gian thực thông qua **Firebase Realtime Database**.

---

## 🌟 Tính Năng Nổi Bật

### 1. Quản Trị Người Dùng Toàn Diện (CRUD)
- **Thêm mới tài khoản:** Nhập thông tin người dùng với cơ chế tự động đánh số khóa tuần tự (`user_01`, `user_02`, `user_03`,...).
- **Cập nhật & Chỉnh sửa:** Đổ dữ liệu tức thì lên form để chỉnh sửa và đồng bộ ngay lập tức lên Firebase.
- **Xóa vĩnh viễn:** Hỗ trợ xóa đơn lẻ hoặc xóa hàng loạt trực tiếp khỏi cơ sở dữ liệu.
- **Xem chi tiết:** Modal pop-up hiển thị đầy đủ thông tin cá nhân và ảnh đại diện kích thước lớn.

### 2. Xử Lý Hình Ảnh Linh Hoạt & Tối Ưu
- **Tải ảnh từ thiết bị:** Tích hợp bộ chọn ảnh (`expo-image-picker`) trên cả di động và máy tính, tự động mã hóa nhị phân sang định dạng **Base64** để lưu trữ an toàn trong CSDL.
- **Tự động tối ưu link Google Drive:** Tự động phát hiện và chuyển đổi link chia sẻ Google Drive sang **Google CDN Direct Link** (`lh3.googleusercontent.com`), giải quyết triệt để lỗi chặn hiển thị hình ảnh (CORS).

### 3. Kiểm Soát & Bảo Mật (Account Ban / Suspend)
- **Khóa / Đình chỉ tài khoản:** Cho phép quản trị viên khóa tài khoản chỉ với 1 click mà không làm mất dữ liệu.
- **Chặn đăng nhập:** Tài khoản khi bị khóa sẽ được gắn nhãn `ĐÃ KHÓA`, đồng thời hệ thống chặn hoàn toàn quyền đăng nhập của tài khoản đó.
- **Mở khóa linh hoạt:** Có thể kích hoạt lại tài khoản bất kỳ lúc nào.

### 4. Thao Tác Hàng Loạt (Bulk Actions)
- Checkbox thông minh ở từng hàng và nút **"Chọn tất cả trang này"**.
- Thực hiện **Khóa hàng loạt** hoặc **Xóa vĩnh viễn hàng loạt** nhiều tài khoản cùng lúc.

### 5. Tìm Kiếm, Sắp Xếp & Phân Trang
- **Tìm kiếm thời gian thực (Live Search):** Lọc ngay lập tức theo Họ và tên hoặc Email khi đang gõ phím.
- **Sắp xếp theo Tên tiếng Việt:** Thuật toán tự động tách từ cuối cùng để sắp xếp bảng chữ cái chuẩn tiếng Việt (A → Z hoặc Z → A).
- **Phân trang (Pagination):** Chia nhỏ danh sách người dùng (5 người/trang) với bộ điều hướng mượt mà, giúp tối ưu hiệu năng khi lượng dữ liệu lớn.

### 6. Trải Nghiệm Người Dùng (UI/UX)
- **Giao diện Sáng / Tối (Dark / Light Theme):** Nút chuyển đổi nhanh chế độ màu, dịu mắt khi sử dụng ban đêm.
- **Thống kê tổng quan (Dashboard):** Thẻ số liệu hiển thị trực quan: Tổng số tài khoản, Số tài khoản có avatar, và Số tài khoản đang bị khóa.
- **Xuất dữ liệu CSDL (Export JSON):** Xuất toàn bộ cơ sở dữ liệu ra file `database.json`:
  - Trên **Web:** Tự động tải file về máy tính.
  - Trên **Mobile:** Kích hoạt bảng chia sẻ hệ thống (System Share Sheet) để lưu vào tệp hoặc gửi qua Zalo/Drive/Email.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend:** React Native (Expo SDK 58), React 19
- **Backend / Cơ sở dữ liệu:** Firebase Realtime Database (REST & SDK)
- **Thư viện hỗ trợ:**
  - `expo-image-picker`: Chọn và xử lý hình ảnh
  - `expo-file-system/next`: Xử lý hệ thống file chuẩn SDK 58
  - `expo-sharing`: Chia sẻ và lưu trữ file trên thiết bị di động
  - `react-native-web`: Hỗ trợ hiển thị và tương tác trên nền tảng Web

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
- Đã cài đặt **Node.js** (khuyến nghị phiên bản 18 trở lên).
- Ứng dụng **Expo Go** trên điện thoại (nếu muốn test trên thiết bị thật).

### Các Bước Thực Hiện

1. **Clone dự án về máy:**
   ```bash
   git clone https://github.com/tam150105/user_management.git
   cd user_management
   ```

2. **Cài đặt các gói thư viện:**
   ```bash
   npm install
   ```

3. **Cấu hình Firebase (Nếu sử dụng database riêng):**
   - Mở file `firebaseConfig.js` và cập nhật đường dẫn `databaseURL`:
   ```javascript
   export const firebaseConfig = {
     databaseURL: "https://your-firebase-database-url.firebasedatabase.app"
   };
   ```

4. **Khởi chạy ứng dụng:**
   - **Chạy trên nền tảng Web:**
     ```bash
     npm run web
     ```
     Truy cập vào: `http://localhost:8081`

   - **Chạy trên Thiết bị Di động (Mobile):**
     ```bash
     npx expo start
     ```
     Mở app **Expo Go** trên điện thoại và quét mã QR hiển thị tại Terminal.

---

## 📋 Cấu Trúc Dữ Liệu Chuẩn

Mỗi bản ghi người dùng trong Firebase Realtime Database được thiết kế tinh gọn gồm 4 trường dữ liệu chính:

```json
{
  "users": {
    "user_01": {
      "email": "admin@gmail.com",
      "matkhau": "123456",
      "hoten": "Nguyễn Văn Quản Trị",
      "hinhanh": "https://lh3.googleusercontent.com/d/..."
    }
  }
}
```

---

## 👤 Tác Giả
- **GitHub:** [@tam150105](https://github.com/tam150105)
- **Repository:** [user_management](https://github.com/tam150105/user_management)
