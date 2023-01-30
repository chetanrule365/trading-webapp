import { configureStore, createReducer } from '@reduxjs/toolkit';

const reducer = createReducer({}, builder => {
  builder.addDefaultCase((state, action) => ({
    ...state,
    ...{ [action.type]: action?.payload },
  }));
});

export default configureStore({
  reducer,
});
