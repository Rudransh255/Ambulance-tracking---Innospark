const bgColors = {
  'A+': 'bg-blue-100 text-blue-700',
  'A-': 'bg-blue-50 text-blue-600',
  'B+': 'bg-green-100 text-green-700',
  'B-': 'bg-green-50 text-green-600',
  'AB+': 'bg-purple-100 text-purple-700',
  'AB-': 'bg-purple-50 text-purple-600',
  'O+': 'bg-red-100 text-red-700',
  'O-': 'bg-red-50 text-red-600',
};

export default function BloodGroupBadge({ group, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';
  return (
    <span className={`badge ${bgColors[group] || 'bg-gray-100 text-gray-700'} ${sizeClass} font-semibold`}>
      {group}
    </span>
  );
}
