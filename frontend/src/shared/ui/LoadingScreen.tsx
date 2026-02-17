import { Spinner } from './Spinner';

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <Spinner size="m" />
    </div>
  );
}
