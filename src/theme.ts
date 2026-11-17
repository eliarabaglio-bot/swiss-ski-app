// Tema "neve": chiaro, azzurro ghiaccio.
import { Platform } from 'react-native';

export const colors = {
  bg: '#EEF4FA',
  card: '#FFFFFF',
  tile: '#F4F8FC',
  border: '#DCE7F1',
  divider: '#EDF2F7',
  text: '#0F2233',
  muted: '#5B7083',
  primary: '#1E6FD9',
  primaryDark: '#1553A8',
  primarySoft: '#E3EFFC',
  snow: '#7DB8F5',
  good: '#1F9D55',
  warn: '#D97706',
  bad: '#C0392B',
  star: '#F5B300',
};

export const radius = { sm: 8, md: 14, lg: 20 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

export const shadow = {
  card: Platform.select({
    ios: { shadowColor: '#1B3A5C', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    android: { elevation: 3 },
    default: { boxShadow: '0 4px 14px rgba(27,58,92,0.08)' },
  }) as object,
};
