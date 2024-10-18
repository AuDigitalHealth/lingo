import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
interface MenuState {
  openItem: (string | undefined)[];
  openComponent: string;
  selectedID: string | null;
  drawerOpen: boolean;
  componentDrawerOpen: boolean;
  error: string | null;

  // Actions
  activeItem: (payload: { openItem: (string | undefined)[] }) => void;
  activeID: (id: string) => void;
  activeComponent: (payload: { openComponent: string }) => void;
  openDrawer: (isOpen: boolean) => void;
  openComponentDrawer: (payload: { componentDrawerOpen: boolean }) => void;
}

interface SnackbarState {
  action: boolean;
  open: boolean;
  message: string;
  anchorOrigin: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  variant: 'alert' | 'standard' | 'filled' | 'outlined';
  alert: {
    color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    variant: 'filled' | 'outlined';
  };
  transition: 'fade' | 'grow' | 'slide' | 'zoom';
  close: boolean;
  actionButton: boolean;

  // Actions
  openSnackbar: (payload: Partial<SnackbarState>) => void;
  closeSnackbar: () => void;
}

interface RootState extends MenuState, SnackbarState {}

const useLayoutStore = create<RootState>()(
  devtools(set => ({
    // Menu State
    openItem: ['dashboard'],
    openComponent: 'buttons',
    selectedID: null,
    drawerOpen: false,
    componentDrawerOpen: true,
    error: null,

    // Menu Actions
    activeItem: payload => set({ openItem: payload.openItem }),
    activeID: id => set({ selectedID: id }),
    activeComponent: payload => set({ openComponent: payload.openComponent }),
    openDrawer: isOpen => {
      set({ drawerOpen: isOpen });
    },
    openComponentDrawer: payload =>
      set({ componentDrawerOpen: payload.componentDrawerOpen }),

    // Snackbar State
    action: false,
    open: false,
    message: 'Note archived',
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'right',
    },
    variant: 'alert',
    alert: {
      color: 'primary',
      variant: 'filled',
    },
    transition: 'grow',
    close: true,
    actionButton: false,

    // Snackbar Actions
    openSnackbar: payload =>
      set(state => ({ ...state, ...payload, open: true })),
    closeSnackbar: () => set({ open: false }),
  })),
);

export default useLayoutStore;
