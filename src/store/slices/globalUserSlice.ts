import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GlobalUserState {
  balance: number;
}

const initialState: GlobalUserState = {
  balance: 0,
};

const globalUserSlice = createSlice({
  name: 'globalUser',
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
  },
});

export const { setBalance } = globalUserSlice.actions;
export default globalUserSlice.reducer;