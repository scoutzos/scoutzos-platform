import { Construction } from 'lucide-react';

export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
      <Construction className="h-16 w-16 text-gray-300 mb-4" />
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        This feature is coming soon. We&apos;re working hard to bring you the best property management experience.
      </p>
    </div>
  );
}
