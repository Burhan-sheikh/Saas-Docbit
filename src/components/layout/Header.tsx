import { useNavigate } from 'react-router-dom';
import { Bell, LogOut, Settings, CreditCard, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Dropdown, DropdownItem, Badge } from '@/components/ui';
import { useUnreadCount } from '@/hooks/useNotifications';
import { NotificationsPreview } from '@/components/notifications/NotificationsPreview';
import { useMySubscription } from '@/hooks/useBilling';

export function Header() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: unread } = useUnreadCount();
  const { data: subscription } = useMySubscription();

  return (
    <header className="safe-top sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white md:hidden">S</div>
        {subscription?.plan && (
          <Badge variant={subscription.plan.slug === 'free' ? 'gray' : 'brand'} className="hidden sm:inline-flex">
            {subscription.plan.name} plan
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Dropdown
          align="right"
          trigger={
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 focus-ring" aria-label="Notifications">
              <Bell className="h-[18px] w-[18px]" />
              {Boolean(unread) && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
          }
          className="w-80 p-0"
        >
          {(close) => <NotificationsPreview onNavigate={close} />}
        </Dropdown>

        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 focus-ring">
              <Avatar name={profile?.full_name} email={profile?.email} src={profile?.avatar_url} size="sm" />
            </button>
          }
        >
          {(close) => (
            <>
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-gray-900">{profile?.full_name || 'Your account'}</p>
                <p className="truncate text-xs text-gray-500">{profile?.email}</p>
              </div>
              <div className="p-1">
                <DropdownItem onClick={() => { navigate('/settings'); close(); }}>
                  <User className="h-4 w-4" /> Profile settings
                </DropdownItem>
                <DropdownItem onClick={() => { navigate('/billing'); close(); }}>
                  <CreditCard className="h-4 w-4" /> Billing
                </DropdownItem>
                <DropdownItem onClick={() => { navigate('/settings'); close(); }}>
                  <Settings className="h-4 w-4" /> Preferences
                </DropdownItem>
                <DropdownItem
                  danger
                  onClick={async () => {
                    close();
                    await signOut();
                    navigate('/login');
                  }}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownItem>
              </div>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
