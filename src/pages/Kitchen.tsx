import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getTimingState, getTimingClass, formatElapsed } from '@/lib/utils';
import type { Order, OrderItem, MenuItem, Tab } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/hooks/use-theme';
import {
  Check,
  Volume2,
  VolumeX,
  Home,
  AlertTriangle,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

type OrderWithDetails = Order & {
  order_items: (OrderItem & { menu_item: MenuItem })[];
  tab: Tab;
};

export function Kitchen() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();

  const audioContextRef = useRef<AudioContext | null>(null);
  const alertBufferRef = useRef<AudioBuffer | null>(null);

  // Load orders on mount
  useEffect(() => {
    loadOrders();

    // Subscribe to order changes
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New order - play sound and reload
            playAlert();
            loadOrders();
          } else if (payload.eventType === 'UPDATE') {
            // Order updated - reload to get latest status
            loadOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update elapsed time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadOrders() {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        *,
        tab:tabs (*),
        order_items (
          *,
          menu_item:menu_items (*)
        )
      `
      )
      .in('status', ['in_progress', 'editing'])
      .order('created_at', { ascending: true });

    setLoading(false);

    if (error) {
      toast({
        title: 'Error loading orders',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setOrders((data as OrderWithDetails[]) || []);
  }

  // Initialize audio on user interaction (required by browsers)
  const initAudio = useCallback(async () => {
    if (audioContextRef.current) {
      setAudioEnabled(true);
      return;
    }

    try {
      audioContextRef.current = new AudioContext();

      // Create a simple beep sound
      const sampleRate = audioContextRef.current.sampleRate;
      const duration = 0.3;
      const buffer = audioContextRef.current.createBuffer(
        1,
        sampleRate * duration,
        sampleRate
      );
      const channel = buffer.getChannelData(0);

      for (let i = 0; i < buffer.length; i++) {
        // Generate a 880Hz beep with envelope
        const t = i / sampleRate;
        const envelope =
          Math.min(1, 10 * t) * Math.max(0, 1 - 3 * (t - duration + 0.1));
        channel[i] = envelope * Math.sin(2 * Math.PI * 880 * t) * 0.5;
      }

      alertBufferRef.current = buffer;
      setAudioEnabled(true);

      // Play a test beep to confirm
      playAlert(true); // Force play test beep
      toast({
        title: 'Audio enabled',
        description: 'You will hear alerts for new orders',
      });
    } catch (err) {
      toast({
        title: 'Audio failed',
        description: 'Could not enable audio alerts',
        variant: 'destructive',
      });
    }
  }, []);

  // Toggle audio on/off
  function toggleAudio() {
    if (audioEnabled) {
      setAudioEnabled(false);
      toast({
        title: 'Audio disabled',
        description: 'You will not hear alerts for new orders',
      });
    } else {
      initAudio();
    }
  }

  function playAlert(force = false) {
    // Skip if audio is disabled (unless forced)
    if (!force && !audioEnabled) return;
    if (!audioContextRef.current || !alertBufferRef.current) return;

    try {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = alertBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error('Failed to play alert:', err);
    }
  }

  async function markComplete(orderId: string) {
    setCompleting(orderId);

    const { data, error } = await supabase.rpc('complete_order', {
      p_order_id: orderId,
    });

    setCompleting(null);

    if (error) {
      toast({
        title: 'Error completing order',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (!data) {
      toast({
        title: 'Could not complete order',
        description: 'Order may have been modified',
        variant: 'destructive',
      });
      return;
    }

    // Remove from list immediately
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast({ title: 'Order completed!' });
  }

  // Use shared timing utilities with consistent 6/12 min thresholds (FR-006)
  function getElapsedClass(createdAt: string): string {
    const state = getTimingState(createdAt);
    return getTimingClass(state);
  }

  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* Header */}
      <header className='bg-card border-b p-4 flex items-center justify-between'>
        <h1 className='text-xl font-bold'>
          <span className='md:hidden'>Kitchen</span>
          <span className='hidden md:inline'>Kitchen Display</span>
        </h1>
        <div className='flex items-center gap-2 md:gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleTheme}
            className='text-muted-foreground hover:text-foreground'
          >
            {theme === 'dark' ? (
              <Sun className='w-4 h-4' />
            ) : (
              <Moon className='w-4 h-4' />
            )}
          </Button>
          <Button
            variant={audioEnabled ? 'default' : 'outline'}
            size='sm'
            onClick={toggleAudio}
            className={audioEnabled ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
          >
            {audioEnabled ? (
              <Volume2 className='w-4 h-4' />
            ) : (
              <VolumeX className='w-4 h-4' />
            )}
            <span className='ml-1 hidden md:inline'>
              {audioEnabled ? 'Disable Audio' : 'Enable Audio'}
            </span>
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => (window.location.hash = '#/')}
            className='text-muted-foreground hover:text-foreground'
          >
            <Home className='w-4 h-4' />
            <span className='ml-1 hidden md:inline'>FOH</span>
          </Button>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => supabase.auth.signOut()}
            className='text-muted-foreground hover:text-foreground'
          >
            <LogOut className='w-4 h-4' />
            <span className='sr-only'>Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Orders Grid */}
      <div className='p-4'>
        {loading ? (
          <div className='text-center text-muted-foreground py-12'>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className='text-center text-muted-foreground py-12'>
            <p className='text-2xl mb-2'>No active orders</p>
            <p className='text-sm'>Orders will appear here when submitted</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {orders.map((order) => (
              <Card
                key={order.id}
                className={
                  order.status === 'editing' ? 'border-yellow-500 border-2' : ''
                }
              >
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-lg'>
                      {order.tab.name}
                    </CardTitle>
                    <span
                      className={`text-sm ${getElapsedClass(order.created_at)}`}
                    >
                      {formatElapsed(order.created_at, now)}
                    </span>
                  </div>
                  {order.status === 'editing' && (
                    <div className='flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-sm'>
                      <AlertTriangle className='w-4 h-4' />
                      BEING EDITED - HOLD
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Order items */}
                  <div className='space-y-2 mb-4'>
                    {order.order_items.map((item) => (
                      <div key={item.id} className='flex items-start gap-2'>
                        <span className='bg-muted px-2 py-0.5 rounded text-sm font-mono min-w-[2rem] text-center'>
                          {item.quantity}x
                        </span>
                        <div className='flex-1'>
                          <div className='font-medium'>
                            {item.menu_item.name}
                          </div>
                          {item.notes && (
                            <div className='text-sm text-accent italic'>
                              → {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order notes */}
                  {order.notes && (
                    <div className='bg-muted rounded p-2 mb-4 text-sm'>
                      <span className='text-muted-foreground font-medium'>Note:</span>{' '}
                      {order.notes}
                    </div>
                  )}

                  {/* Complete button */}
                  <Button
                    className='w-full bg-green-600 hover:bg-green-700 text-white'
                    size='lg'
                    onClick={() => markComplete(order.id)}
                    disabled={
                      completing === order.id || order.status === 'editing'
                    }
                  >
                    <Check className='w-5 h-5 mr-2' />
                    {completing === order.id
                      ? 'Completing...'
                      : 'Mark Complete'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Order count footer */}
      <footer className='fixed bottom-0 left-0 right-0 bg-card border-t p-3 text-center'>
        <span className='text-lg font-semibold'>
          {orders.length} active order{orders.length !== 1 ? 's' : ''}
        </span>
      </footer>
    </div>
  );
}
