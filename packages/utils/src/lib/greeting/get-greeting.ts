export const getGreeting = (): string => {
  const hour = new Date().getHours();

  switch (true) {
    case hour > 17:
      return 'Good Evening';
    case hour > 11:
      return 'Good Afternoon';
    case hour > 2:
      return 'Good Morning';
    default:
      return 'Good Night';
  }
};