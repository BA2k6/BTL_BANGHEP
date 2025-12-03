// ownerSlice.js (hoặc userSlice.js)
const ownerSlice = createSlice({
  name: 'owners',
  initialState: { list: [] },
  reducers: {
    // ... các reducer khác
    updateOwnerInList: (state, action) => {
      const updatedUser = action.payload;
      // Tìm vị trí người dùng trong danh sách và cập nhật đè lên
      const index = state.list.findIndex(user => user.id === updatedUser.id);
      if (index !== -1) {
        state.list[index] = { ...state.list[index], ...updatedUser };
      }
    },
  },
});