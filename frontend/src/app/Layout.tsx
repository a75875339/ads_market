import { Outlet } from 'react-router';
import { BottomNav } from '../shared/ui';

export function Layout() {
  return (
    <>
      <div className="page">
        <div className="page-content">
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </>
  );
}
