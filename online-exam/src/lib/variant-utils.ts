// Helper utilities for Exam Variant Shuffling & Scrambling

export function reorderQuestionOptions(options: any, permutation: number[]) {
  if (!options || !permutation || permutation.length === 0) return options;
  if (Array.isArray(options)) {
    return permutation.map(origIdx => options[origIdx]).filter(Boolean);
  } else if (typeof options === 'object') {
    const keys = Object.keys(options).sort();
    const newOptions: Record<string, any> = {};
    keys.forEach((newKey, pos) => {
      const origIdx = permutation[pos];
      const origKey = keys[origIdx];
      newOptions[newKey] = options[origKey] !== undefined ? options[origKey] : '';
    });
    return newOptions;
  }
  return options;
}
