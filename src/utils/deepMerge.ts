export function deepMerge<T>(base: T, override: unknown): T {
  if (!isRecord(base) || !isRecord(override)) {
    return override === undefined ? base : (override as T);
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return override === undefined ? base : (override as T);
  }

  const output: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = output[key];

    if (isRecord(baseValue) && isRecord(value) && !Array.isArray(baseValue) && !Array.isArray(value)) {
      output[key] = deepMerge(baseValue, value);
    } else {
      output[key] = value;
    }
  }

  return output as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
