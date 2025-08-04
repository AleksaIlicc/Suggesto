export const DEFAULT_CATEGORIES = [
  { name: 'bug', color: '#ef4444' },
  { name: 'feature', color: '#3b82f6' },
  { name: 'improvement', color: '#10b981' },
  { name: 'other', color: '#6b7280' },
];

export const getDefaultCategories = () => DEFAULT_CATEGORIES;

export const getCategoryByName = (name: string) => {
  return DEFAULT_CATEGORIES.find(
    category => category.name.toLowerCase() === name.toLowerCase()
  );
};
