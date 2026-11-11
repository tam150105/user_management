import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Paths, File } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import {
  ref,
  onValue,
  set,
  update,
  remove,
} from 'firebase/database';
import { db } from './firebaseConfig';

const PAGE_SIZE = 5;

export default function App() {
  // NÂNG CAO: Chế độ sáng / tối (Dark Mode / Light Mode)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [loginEmail, setLoginEmail] = useState('admin@gmail.com');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [loginError, setLoginError] = useState('');

  // Users list (CHỈ ĐÚNG 4 TRƯỜNG TRONG CSDL: email, matkhau, hoten, hinhanh)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state (Thêm / Sửa)
  const [editingId, setEditingId] = useState(null);
  const [email, setEmail] = useState('');
  const [matkhau, setMatkhau] = useState('');
  const [hoten, setHoten] = useState('');
  const [hinhanh, setHinhanh] = useState('');

  // NÂNG CAO 1: KHÓA TÀI KHOẢN (BAN/SUSPEND)
  const [bannedUserIds, setBannedUserIds] = useState([]);

  // NÂNG CAO 2: Tìm kiếm & Sắp xếp theo TÊN
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  // NÂNG CAO 3: Phân trang (Pagination)
  const [currentPage, setCurrentPage] = useState(1);

  // NÂNG CAO 4: Thao tác hàng loạt (Bulk Actions)
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // NÂNG CAO 5: Xem chi tiết Modal
  const [viewingUser, setViewingUser] = useState(null);

  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? '' : prev));
    }, 3000);
  };

  // Hệ màu chủ đề động Sáng / Tối
  const theme = useMemo(() => {
    if (isDarkMode) {
      return {
        bg: '#0f172a',
        cardBg: '#1e293b',
        border: '#334155',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',
        inputBg: '#0f172a',
        headerBg: '#1e293b',
        btnSecondaryBg: '#334155',
        btnSecondaryText: '#cbd5e1',
        userRowBorder: '#334155',
        statBoxBg: '#1e293b',
      };
    }
    return {
      bg: '#f8fafc',
      cardBg: '#ffffff',
      border: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#64748b',
      inputBg: '#ffffff',
      headerBg: '#ffffff',
      btnSecondaryBg: '#f1f5f9',
      btnSecondaryText: '#475569',
      userRowBorder: '#f1f5f9',
      statBoxBg: '#ffffff',
    };
  }, [isDarkMode]);

  // ĐỒNG BỘ TRỰC TIẾP 100% VỚI FIREBASE REALTIME DATABASE
  useEffect(() => {
    if (!db) return;

    setLoading(true);
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const parsed = Object.entries(data).map(([id, val]) => ({
            id,
            email: val.email || '',
            matkhau: val.matkhau || '',
            hoten: val.hoten || '',
            hinhanh: val.hinhanh || '',
          }));
          setUsers(parsed);
        } else {
          setUsers([]);
        }
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        showToast('Lỗi tải Firebase: ' + error.message);
      }
    );

    return () => unsubscribe();
  }, []);

  // Nạp 4 tài khoản mẫu lên Firebase nếu CSDL đang trống
  const handleSeedFirebase = async () => {
    if (!db) return;
    try {
      const sample = {
        user_01: {
          email: "admin@gmail.com",
          matkhau: "123456",
          hoten: "Nguyễn Văn Quản Trị",
          hinhanh: "https://i.pravatar.cc/150?img=11"
        },
        user_02: {
          email: "tranvanb@gmail.com",
          matkhau: "matkhau123",
          hoten: "Trần Văn Bình",
          hinhanh: "https://i.pravatar.cc/150?img=12"
        },
        user_03: {
          email: "lethic@gmail.com",
          matkhau: "abc12345",
          hoten: "Lê Thị Cẩm",
          hinhanh: "https://i.pravatar.cc/150?img=5"
        },
        user_04: {
          email: "phamvand@gmail.com",
          matkhau: "999999",
          hoten: "Phạm Văn Dũng",
          hinhanh: "https://i.pravatar.cc/150?img=33"
        }
      };
      await set(ref(db, 'users'), sample);
      showToast('Đã nạp 4 người dùng mẫu lên Firebase!');
    } catch (err) {
      alert('Lỗi nạp mẫu: ' + err.message);
    }
  };

  // ĐĂNG NHẬP
  const handleLogin = () => {
    setLoginError('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Vui lòng nhập email và mật khẩu');
      return;
    }

    if (users.length === 0) {
      if (loginEmail.trim() === 'admin@gmail.com' && loginPassword.trim() === '123456') {
        setCurrentUser({
          email: 'admin@gmail.com',
          hoten: 'Quản trị viên',
          matkhau: '123456',
          hinhanh: 'https://i.pravatar.cc/150?img=11',
        });
        return;
      }
    }

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
        String(u.matkhau) === loginPassword.trim()
    );

    if (found) {
      if (bannedUserIds.includes(found.id)) {
        setLoginError('Tài khoản này đã bị Quản trị viên KHÓA, không thể đăng nhập!');
        return;
      }
      setCurrentUser(found);
    } else {
      setLoginError('Email hoặc mật khẩu không chính xác');
    }
  };

  // Chọn ảnh từ thiết bị
  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted' && Platform.OS !== 'web') {
        alert('Cần cấp quyền truy cập ảnh trên thiết bị');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          setHinhanh(`data:${mimeType};base64,${asset.base64}`);
        } else if (asset.uri) {
          setHinhanh(asset.uri);
        }
        showToast('Đã tải ảnh lên');
      }
    } catch (err) {
      alert('Lỗi chọn ảnh: ' + err.message);
    }
  };

  // Chuẩn hóa link ảnh Google Drive sang CDN trực tiếp
  const formatImageUrl = (url) => {
    if (!url) return '';
    const trimmed = url.trim();
    const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
    }
    return trimmed;
  };

  // Tạo key tuần tự: user_01, user_02, ... user_05
  const getNextUserKey = () => {
    let maxNum = 0;
    users.forEach((u) => {
      if (u.id) {
        const match = u.id.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    const formatted = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    return `user_${formatted}`;
  };

  // Lưu người dùng (CHỈ ĐÚNG 4 TRƯỜNG CSDL: email, matkhau, hoten, hinhanh)
  const handleSaveUser = async () => {
    if (!hoten.trim() || !email.trim() || !matkhau.trim()) {
      alert('Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu');
      return;
    }

    const payload = {
      email: email.trim(),
      matkhau: matkhau.trim(),
      hoten: hoten.trim(),
      hinhanh: formatImageUrl(hinhanh) || 'https://i.pravatar.cc/150?img=68',
    };

    try {
      if (db) {
        if (editingId) {
          await update(ref(db, `users/${editingId}`), payload);
          showToast('Cập nhật Firebase thành công');
        } else {
          const nextKey = getNextUserKey();
          await set(ref(db, `users/${nextKey}`), payload);
          showToast(`Thêm mới thành công (${nextKey})`);
        }
      }
      resetForm();
    } catch (err) {
      alert('Lỗi lưu Firebase: ' + err.message);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEmail(user.email);
    setMatkhau(user.matkhau);
    setHoten(user.hoten);
    setHinhanh(user.hinhanh);
  };

  // Khóa / Mở khóa
  const toggleBanUser = (user) => {
    if (bannedUserIds.includes(user.id)) {
      setBannedUserIds((prev) => prev.filter((id) => id !== user.id));
      showToast(`Đã mở khóa "${user.hoten}"`);
    } else {
      setBannedUserIds((prev) => [...prev, user.id]);
      showToast(`Đã khóa "${user.hoten}" (Không thể đăng nhập)`);
    }
  };

  // Xóa vĩnh viễn khỏi Firebase
  const handleDeletePermanent = async (user) => {
    const confirmDelete = Platform.OS === 'web'
      ? window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng "${user.hoten}" khỏi CSDL?`)
      : true;

    if (!confirmDelete) return;

    try {
      if (db) {
        await remove(ref(db, `users/${user.id}`));
      }
      showToast(`Đã xóa vĩnh viễn "${user.hoten}"`);
      if (editingId === user.id) resetForm();
      setSelectedUserIds((prev) => prev.filter((id) => id !== user.id));
      setBannedUserIds((prev) => prev.filter((id) => id !== user.id));
    } catch (err) {
      alert('Lỗi khi xóa: ' + err.message);
    }
  };

  // Xóa hàng loạt
  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0) return;
    const confirmBulk = Platform.OS === 'web'
      ? window.confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN ${selectedUserIds.length} người dùng đã chọn khỏi CSDL?`)
      : true;
    if (!confirmBulk) return;

    try {
      for (const id of selectedUserIds) {
        if (db) {
          await remove(ref(db, `users/${id}`));
        }
      }
      showToast(`Đã xóa vĩnh viễn ${selectedUserIds.length} người dùng`);
      setSelectedUserIds([]);
    } catch (err) {
      alert('Lỗi xóa: ' + err.message);
    }
  };

  // Khóa hàng loạt
  const handleBulkBan = () => {
    if (selectedUserIds.length === 0) return;
    setBannedUserIds((prev) => Array.from(new Set([...prev, ...selectedUserIds])));
    showToast(`Đã khóa ${selectedUserIds.length} tài khoản`);
    setSelectedUserIds([]);
  };

  const toggleSelectUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setEditingId(null);
    setEmail('');
    setMatkhau('');
    setHoten('');
    setHinhanh('');
  };

  // Xuất file JSON (hoạt động thật trên cả Web lẫn Điện thoại di động)
  const handleExportJson = async () => {
    const exportObj = { users: {} };
    users.forEach((u, idx) => {
      const key = u.id || `user_0${idx + 1}`;
      exportObj.users[key] = {
        email: u.email,
        matkhau: u.matkhau,
        hoten: u.hoten,
        hinhanh: u.hinhanh,
      };
    });
    const jsonStr = JSON.stringify(exportObj, null, 2);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'database.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã tải xuống file database.json');
    } else {
      // TRÊN ĐIỆN THOẠI: Tạo file database.json thật trong máy và mở menu Lưu/Chia sẻ (Zalo, Drive, Tải về)
      try {
        const file = new File(Paths.document, 'database.json');
        if (!file.exists) {
          file.create();
        }
        file.write(jsonStr);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/json',
            dialogTitle: 'Lưu hoặc chia sẻ file database.json',
            UTI: 'public.json',
          });
          showToast('Đã xuất file database.json thành công!');
        } else {
          alert(`Đã lưu file tại:\n${file.uri}`);
        }
      } catch (err) {
        alert('Lỗi xuất file: ' + err.message);
      }
    }
  };

  // Lấy từ TÊN cuối cùng để sắp xếp chuẩn tiếng Việt (Bình -> Cẩm -> Dũng...)
  const getFirstNameForSort = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[parts.length - 1];
    return `${firstName} ${fullName}`.toLowerCase();
  };

  // Lọc và sắp xếp theo TÊN
  const processedUsers = useMemo(() => {
    return users
      .filter(
        (u) =>
          u.hoten.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const nameA = getFirstNameForSort(a.hoten);
        const nameB = getFirstNameForSort(b.hoten);
        if (sortOrder === 'asc') return nameA.localeCompare(nameB, 'vi');
        return nameB.localeCompare(nameA, 'vi');
      });
  }, [users, searchQuery, sortOrder]);

  // Phân trang
  const totalPages = Math.ceil(processedUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedUsers.slice(start, start + PAGE_SIZE);
  }, [processedUsers, currentPage]);

  const isAllCurrentSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers.every((u) => selectedUserIds.includes(u.id));

  const toggleSelectAllCurrentPage = () => {
    if (isAllCurrentSelected) {
      setSelectedUserIds((prev) =>
        prev.filter((id) => !paginatedUsers.some((u) => u.id === id))
      );
    } else {
      const currentIds = paginatedUsers.map((u) => u.id);
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  // ==========================================================================
  // GIAO DIỆN ĐĂNG NHẬP
  // ==========================================================================
  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.loginWrapper, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        
        {/* Nút đổi giao diện Sáng / Tối trên màn hình Đăng nhập */}
        <TouchableOpacity
          style={[styles.btnThemeToggleLogin, { backgroundColor: theme.cardBg, borderColor: theme.border }]}
          onPress={() => setIsDarkMode(!isDarkMode)}
        >
          <Text style={{ fontSize: 16 }}>{isDarkMode ? '☀️ Chế độ Sáng' : '🌙 Chế độ Tối'}</Text>
        </TouchableOpacity>

        <View style={[styles.loginCard, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
          <Text style={[styles.appBrand, { color: theme.textPrimary }]}>Quản Lý Người Dùng</Text>
          <Text style={[styles.loginSub, { color: theme.textSecondary }]}>Đăng nhập để vào hệ thống</Text>

          {loginError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{loginError}</Text>
            </View>
          ) : null}

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            placeholder="admin@gmail.com"
            placeholderTextColor={theme.textSecondary}
            value={loginEmail}
            onChangeText={setLoginEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Mật khẩu</Text>
          <TextInput
            style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
            placeholder="Nhập mật khẩu"
            placeholderTextColor={theme.textSecondary}
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.btnLoginSubmit}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.btnLoginSubmitText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================================
  // GIAO DIỆN TRANG CHÍNH (ADMIN DASHBOARD)
  // ==========================================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.appHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerInfo}>
          <Text style={[styles.appHeaderTitle, { color: theme.textPrimary }]}>Quản Lý Người Dùng</Text>
          <Text style={[styles.appHeaderUser, { color: theme.textSecondary }]}>
            {currentUser.hoten} ({currentUser.email})
          </Text>
        </View>
        <View style={styles.headerRight}>
          {/* NÚT ĐỔI SÁNG / TỐI TRÊN HEADER */}
          <TouchableOpacity
            style={[styles.btnThemeHeader, { backgroundColor: theme.btnSecondaryBg, borderColor: theme.border }]}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            <Text style={{ fontSize: 13, color: theme.textPrimary }}>
              {isDarkMode ? '☀️ Sáng' : '🌙 Tối'}
            </Text>
          </TouchableOpacity>

          {/* NÚT XUẤT JSON HIỂN THỊ CẢ TRÊN WEB VÀ MOBILE */}
          <TouchableOpacity
            style={[styles.btnExport, { backgroundColor: theme.btnSecondaryBg, borderColor: theme.border }]}
            onPress={handleExportJson}
          >
            <Text style={[styles.btnExportText, { color: theme.btnSecondaryText }]}>Xuất JSON</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnLogout}
            onPress={() => setCurrentUser(null)}
          >
            <Text style={styles.btnLogoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </View>

      {toastMsg ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.bodyScroll}>
        {/* DASHBOARD THỐNG KÊ */}
        <View style={styles.statGrid}>
          <View style={[styles.statBox, { backgroundColor: theme.statBoxBg, borderColor: theme.border }]}>
            <Text style={styles.statValue}>{users.length}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tổng người dùng</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.statBoxBg, borderColor: theme.border }]}>
            <Text style={styles.statValue}>
              {users.filter((u) => u.hinhanh && u.hinhanh.trim() !== '').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Đã có ảnh đại diện</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.statBoxBg, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: '#dc2626' }]}>
              {bannedUserIds.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Tài khoản bị khóa (Ban)</Text>
          </View>
        </View>

        <View style={styles.layout}>
          {/* CỘT 1: FORM NHẬP / SỬA */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <Text style={[styles.cardHeading, { color: theme.textPrimary }]}>
              {editingId ? 'Cập nhật thông tin' : 'Thêm người dùng'}
            </Text>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Họ và tên</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Nguyễn Văn A"
              placeholderTextColor={theme.textSecondary}
              value={hoten}
              onChangeText={setHoten}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Email</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="nguyenvana@gmail.com"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Mật khẩu</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Nhập mật khẩu"
              placeholderTextColor={theme.textSecondary}
              value={matkhau}
              onChangeText={setMatkhau}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Hình ảnh</Text>
            <View style={styles.imagePickerRow}>
              <TextInput
                style={[styles.fieldInput, { flex: 1, marginBottom: 0, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
                placeholder="Link ảnh hoặc bấm chọn..."
                placeholderTextColor={theme.textSecondary}
                value={hinhanh}
                onChangeText={setHinhanh}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.btnPickImg} onPress={handlePickImage}>
                <Text style={styles.btnPickImgText}>Chọn ảnh</Text>
              </TouchableOpacity>
            </View>

            {hinhanh ? (
              <View style={styles.avatarPreview}>
                <Image source={{ uri: formatImageUrl(hinhanh) }} style={styles.previewImage} />
                <TouchableOpacity onPress={() => setHinhanh('')}>
                  <Text style={styles.clearImgText}>Xóa ảnh</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  editingId ? { backgroundColor: '#d97706' } : {},
                ]}
                onPress={handleSaveUser}
              >
                <Text style={styles.btnPrimaryText}>
                  {editingId ? 'Lưu thay đổi' : 'Thêm mới'}
                </Text>
              </TouchableOpacity>

              {editingId && (
                <TouchableOpacity
                  style={[styles.btnCancel, { backgroundColor: theme.btnSecondaryBg }]}
                  onPress={resetForm}
                >
                  <Text style={[styles.btnCancelText, { color: theme.btnSecondaryText }]}>Hủy</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Nút nạp nhanh 4 tài khoản mẫu lên Firebase nếu CSDL đang trống */}
            {users.length === 0 && (
              <TouchableOpacity
                style={styles.btnSeed}
                onPress={handleSeedFirebase}
              >
                <Text style={styles.btnSeedText}>
                  Nạp nhanh 4 tài khoản mẫu lên Firebase
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* CỘT 2: DANH SÁCH & CÁC TÍNH NĂNG NÂNG CAO */}
          <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            <View style={styles.listHeader}>
              <Text style={[styles.cardHeading, { color: theme.textPrimary }]}>
                Danh sách ({processedUsers.length})
              </Text>

              <TouchableOpacity
                style={[styles.btnSort, { backgroundColor: theme.btnSecondaryBg, borderColor: theme.border }]}
                onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                <Text style={[styles.btnSortText, { color: theme.textPrimary }]}>
                  Xếp: {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tìm kiếm */}
            <TextInput
              style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder="Tìm theo tên hoặc email..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setCurrentPage(1);
              }}
            />

            {/* THAO TÁC HÀNG LOẠT */}
            <View style={[styles.bulkBar, { borderBottomColor: theme.userRowBorder }]}>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={toggleSelectAllCurrentPage}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: theme.border, backgroundColor: theme.cardBg },
                    isAllCurrentSelected && styles.checkboxActive,
                  ]}
                >
                  {isAllCurrentSelected && <Text style={styles.checkTick}>✓</Text>}
                </View>
                <Text style={[styles.bulkText, { color: theme.textSecondary }]}>Chọn tất cả trang này</Text>
              </TouchableOpacity>

              {selectedUserIds.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.btnBulkBan}
                    onPress={handleBulkBan}
                  >
                    <Text style={styles.btnBulkBanText}>
                      Khóa ({selectedUserIds.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnBulkDelete}
                    onPress={handleBulkDelete}
                  >
                    <Text style={styles.btnBulkDeleteText}>
                      Xóa vĩnh viễn ({selectedUserIds.length})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {loading ? (
              <ActivityIndicator size="small" color="#0284c7" style={{ margin: 20 }} />
            ) : paginatedUsers.length === 0 ? (
              <Text style={[styles.emptyNotice, { color: theme.textSecondary }]}>
                Cơ sở dữ liệu Firebase hiện đang trống.
              </Text>
            ) : (
              paginatedUsers.map((item) => {
                const isSelected = selectedUserIds.includes(item.id);
                const isBanned = bannedUserIds.includes(item.id);

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.userRow,
                      { borderBottomColor: theme.userRowBorder },
                      editingId === item.id && styles.userRowEditing,
                      isSelected && (isDarkMode ? { backgroundColor: '#1e3a8a' } : styles.userRowSelected),
                      isBanned && (isDarkMode ? { backgroundColor: '#450a0a' } : styles.userRowBanned),
                    ]}
                  >
                    {/* Checkbox */}
                    <TouchableOpacity
                      onPress={() => toggleSelectUser(item.id)}
                      style={styles.checkboxTouch}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: theme.border, backgroundColor: theme.cardBg },
                          isSelected && styles.checkboxActive,
                        ]}
                      >
                        {isSelected && <Text style={styles.checkTick}>✓</Text>}
                      </View>
                    </TouchableOpacity>

                    {/* Avatar */}
                    <TouchableOpacity onPress={() => setViewingUser(item)}>
                      <Image
                        source={{
                          uri: formatImageUrl(item.hinhanh) || 'https://i.pravatar.cc/150?img=68',
                        }}
                        style={styles.userPic}
                      />
                    </TouchableOpacity>

                    {/* Info */}
                    <View style={styles.userDetails}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity onPress={() => setViewingUser(item)}>
                          <Text
                            style={[
                              styles.userNameText,
                              { color: theme.textPrimary },
                              isBanned && styles.userNameBanned,
                            ]}
                          >
                            {item.hoten}
                          </Text>
                        </TouchableOpacity>
                        {isBanned && (
                          <View style={styles.bannedTag}>
                            <Text style={styles.bannedTagText}>ĐÃ KHÓA</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.userEmailText, { color: theme.textSecondary }]}>{item.email}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.rowButtons}>
                      <TouchableOpacity
                        style={styles.btnEdit}
                        onPress={() => handleEdit(item)}
                      >
                        <Text style={styles.btnEditText}>Sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.btnBan,
                          isBanned ? styles.btnUnban : {},
                        ]}
                        onPress={() => toggleBanUser(item)}
                      >
                        <Text
                          style={[
                            styles.btnBanText,
                            isBanned ? styles.btnUnbanText : {},
                          ]}
                        >
                          {isBanned ? 'Mở' : 'Khóa'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.btnDelete, { backgroundColor: theme.btnSecondaryBg, borderColor: theme.border }]}
                        onPress={() => handleDeletePermanent(item)}
                      >
                        <Text style={[styles.btnDeleteText, { color: theme.btnSecondaryText }]}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* PHÂN TRANG */}
            {totalPages > 1 && (
              <View style={[styles.paginationRow, { borderTopColor: theme.userRowBorder }]}>
                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    { backgroundColor: theme.btnSecondaryBg, borderColor: theme.border },
                    currentPage === 1 && styles.pageBtnDisabled,
                  ]}
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <Text style={[styles.pageBtnText, { color: theme.textPrimary }]}>‹ Trước</Text>
                </TouchableOpacity>

                <Text style={[styles.pageInfo, { color: theme.textSecondary }]}>
                  Trang {currentPage} / {totalPages}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.pageBtn,
                    { backgroundColor: theme.btnSecondaryBg, borderColor: theme.border },
                    currentPage === totalPages && styles.pageBtnDisabled,
                  ]}
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <Text style={[styles.pageBtnText, { color: theme.textPrimary }]}>Sau ›</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* MODAL: XEM CHI TIẾT NGƯỜI DÙNG */}
      <Modal visible={!!viewingUser} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {viewingUser && (
            <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Chi tiết người dùng</Text>
              <Image
                source={{
                  uri: formatImageUrl(viewingUser.hinhanh) || 'https://i.pravatar.cc/150?img=68',
                }}
                style={styles.modalAvatar}
              />
              <View style={[styles.detailRow, { borderBottomColor: theme.userRowBorder }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Họ và tên:</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{viewingUser.hoten}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: theme.userRowBorder }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Email:</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{viewingUser.email}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: theme.userRowBorder }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Mật khẩu:</Text>
                <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{viewingUser.matkhau}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: theme.userRowBorder }]}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Trạng thái:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    bannedUserIds.includes(viewingUser.id)
                      ? { color: '#dc2626' }
                      : { color: '#16a34a' },
                  ]}
                >
                  {bannedUserIds.includes(viewingUser.id) ? 'Đang bị khóa' : 'Hoạt động'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.btnSecondary, { marginTop: 16, backgroundColor: theme.btnSecondaryBg }]}
                onPress={() => setViewingUser(null)}
              >
                <Text style={[styles.btnSecondaryText, { color: theme.btnSecondaryText }]}>Đóng</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loginWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  btnThemeToggleLogin: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 48,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    zIndex: 10,
  },
  loginCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 8,
    padding: 24,
    borderWidth: 1,
  },
  btnLoginSubmit: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 6,
  },
  btnLoginSubmitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  appBrand: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  loginSub: {
    fontSize: 14,
    marginBottom: 20,
  },
  appHeader: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 12,
  },
  headerInfo: {
    flex: 1,
  },
  appHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  appHeaderUser: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btnThemeHeader: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnExport: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  btnExportText: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnLogout: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  btnLogoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b91c1c',
  },
  bodyScroll: {
    padding: 16,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statBox: {
    flex: 1,
    minWidth: 130,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0284c7',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  layout: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 16,
    alignItems: 'flex-start',
  },
  card: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnPickImg: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 6,
  },
  btnPickImgText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  avatarPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  previewImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  clearImgText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnCancel: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  btnSeed: {
    marginTop: 14,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnSeedText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnSort: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  btnSortText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bulkBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 6,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxTouch: {
    padding: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  checkTick: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  bulkText: {
    fontSize: 12,
  },
  btnBulkBan: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 4,
  },
  btnBulkBanText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
  },
  btnBulkDelete: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 4,
  },
  btnBulkDeleteText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 10,
  },
  userRowEditing: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  userRowSelected: {
    backgroundColor: '#f0f9ff',
  },
  userRowBanned: {
    backgroundColor: '#fef2f2',
    opacity: 0.85,
  },
  userPic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  userDetails: {
    flex: 1,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userNameBanned: {
    textDecorationLine: 'line-through',
    color: '#991b1b',
  },
  bannedTag: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b91c1c',
  },
  userEmailText: {
    fontSize: 12,
    marginTop: 1,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  btnEdit: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  btnEditText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '600',
  },
  btnBan: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  btnBanText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  btnUnban: {
    backgroundColor: '#dcfce7',
  },
  btnUnbanText: {
    color: '#15803d',
  },
  btnDelete: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  btnDeleteText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  pageBtnDisabled: {
    opacity: 0.4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 12,
  },
  emptyNotice: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 13,
  },
  toast: {
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#dc2626',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignSelf: 'center',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  btnSecondary: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
