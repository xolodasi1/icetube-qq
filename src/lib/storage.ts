
export const SafeStorage = {
  get: <T = any>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return fallback;
      return JSON.parse(item) as T;
    } catch (e) {
      console.warn(`SafeStorage: Error parsing key "${key}"`, e);
      return fallback;
    }
  },

  set: (key: string, value: any): boolean => {
    try {
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key: string, value: any) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return;
            }
            seen.add(value);
          }
          return value;
        };
      };
      const safeString = JSON.stringify(value, getCircularReplacer());
      localStorage.setItem(key, safeString);
      return true;
    } catch (e) {
      console.error(`SafeStorage: Error saving key "${key}"`, e);
      return false;
    }
  },

  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`SafeStorage: Error removing key "${key}"`, e);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error("SafeStorage: Error clearing storage", e);
    }
  }
};
