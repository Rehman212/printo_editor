async function wait(ms = 180) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export const apiClient = {
  async get<T>(fn: () => T | Promise<T>) {
    await wait();
    return fn();
  },
  async mutate<T>(fn: () => T | Promise<T>) {
    await wait(220);
    return fn();
  },
};
