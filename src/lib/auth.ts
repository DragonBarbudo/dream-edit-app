const USERS = [
  { username: 'Albin', password: 'pass123' },
  { username: 'Cora', password: 'pass123' },
  { username: 'Umi', password: 'pass123' },
  { username: 'Leo', password: 'pass123' },
];

export const login = (username: string, password: string): boolean => {
  const user = USERS.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem('currentUser', username);
    return true;
  }
  return false;
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};

export const getCurrentUser = (): string | null => {
  return localStorage.getItem('currentUser');
};

export const isAuthenticated = (): boolean => {
  return !!getCurrentUser();
};
