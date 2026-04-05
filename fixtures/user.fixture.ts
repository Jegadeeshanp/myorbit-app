export const qaUser = {
  id: 'user-qa',
  email: 'qa@myorbit.app',
  name: 'QA Tester',
  role: 'qa',
};

export function getUserFixture() {
  return { ...qaUser };
}
