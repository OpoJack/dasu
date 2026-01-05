import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { getTimingState, getTimingClass, formatElapsed } from '@/lib/utils';
import type { Tab, MenuItem, Order, OrderItem } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { useTheme } from '@/hooks/use-theme';
import {
  Plus,
  Minus,
  Send,
  X,
  ChefHat,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

type OrderDraftItem = {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
};

type OrderWithDetails = Order & {
  order_items: (OrderItem & { menu_item: MenuItem })[];
};

type TabWithOrders = Tab & {
  orders: OrderWithDetails[];
};

export function FrontOfHouse() {
  // Theme
  const { theme, toggleTheme } = useTheme();

  // Tab state
  const [tabs, setTabs] = useState<TabWithOrders[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabWithOrders | null>(null);
  const [newTabName, setNewTabName] = useState('');
  const [creatingTab, setCreatingTab] = useState(false);

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuByCategory, setMenuByCategory] = useState<
    Record<string, MenuItem[]>
  >({});

  // Order draft state
  const [orderDraft, setOrderDraft] = useState<OrderDraftItem[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Add menu item dialog
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    price: '',
    category: 'Food',
  });

  // Close tab confirmation
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // Timer for updating elapsed time (FR-008)
  const [now, setNow] = useState(Date.now());

  // Track acknowledged order completions (for "ready" badge)
  const [acknowledgedOrders, setAcknowledgedOrders] = useState<Set<string>>(
    new Set()
  );

  // Mobile navigation state
  const [mobileView, setMobileView] = useState<'tabs' | 'menu' | 'closeout'>(
    'tabs'
  );

  // Ref to track selected tab ID for use in subscription callback
  const selectedTabIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedTabIdRef.current = selectedTab?.id ?? null;
  }, [selectedTab]);

  // Load tabs and menu items on mount
  useEffect(() => {
    loadTabs();
    loadMenuItems();

    // Subscribe to order completions for notifications
    const channel = supabase
      .channel('foh-ready')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: 'status=eq.complete',
        },
        (payload) => {
          const order = payload.new as Order;
          // Auto-acknowledge if this order belongs to the currently selected tab
          if (order.tab_id === selectedTabIdRef.current) {
            setAcknowledgedOrders((prev) => new Set(prev).add(order.id));
          }
          loadTabs(); // Refresh tabs to update order status
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update elapsed time every 30 seconds (FR-008)
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Update menuByCategory when menuItems change
  useEffect(() => {
    const grouped = menuItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
    setMenuByCategory(grouped);
  }, [menuItems]);

  // Sync selectedTab with updated tabs data
  useEffect(() => {
    if (selectedTab) {
      const updatedTab = tabs.find((t) => t.id === selectedTab.id);
      if (updatedTab) {
        setSelectedTab(updatedTab);
      }
    }
  }, [tabs]);

  async function loadTabs() {
    const { data, error } = await supabase
      .from('tabs')
      .select(
        `
        *,
        orders (
          *,
          order_items (
            *,
            menu_item:menu_items (*)
          )
        )
      `
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading tabs',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setTabs((data as TabWithOrders[]) || []);
  }

  async function loadMenuItems() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category')
      .order('name');

    if (error) {
      toast({
        title: 'Error loading menu',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setMenuItems(data || []);
  }

  async function createTab() {
    if (!newTabName.trim()) {
      toast({ title: 'Enter a tab name', variant: 'destructive' });
      return;
    }

    setCreatingTab(true);
    const { data, error } = await supabase
      .from('tabs')
      .insert({ name: newTabName.trim() })
      .select()
      .single();

    setCreatingTab(false);

    if (error) {
      toast({
        title: 'Error creating tab',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setNewTabName('');
    const newTab = { ...data, orders: [] } as TabWithOrders;
    setTabs((prev) => [newTab, ...prev]);
    setSelectedTab(newTab);
    toast({
      title: 'Tab created',
      description: `Tab "${data.name}" is now open`,
    });
  }

  function addToOrder(item: MenuItem) {
    setOrderDraft((prev) => {
      const existing = prev.find((d) => d.menuItem.id === item.id);
      if (existing) {
        return prev.map((d) =>
          d.menuItem.id === item.id ? { ...d, quantity: d.quantity + 1 } : d
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  }

  function updateQuantity(itemId: string, delta: number) {
    setOrderDraft((prev) => {
      return prev
        .map((d) => {
          if (d.menuItem.id === itemId) {
            const newQty = d.quantity + delta;
            return newQty > 0 ? { ...d, quantity: newQty } : null;
          }
          return d;
        })
        .filter((d): d is OrderDraftItem => d !== null);
    });
  }

  function updateItemNotes(itemId: string, notes: string) {
    setOrderDraft((prev) =>
      prev.map((d) => (d.menuItem.id === itemId ? { ...d, notes } : d))
    );
  }

  function removeFromOrder(itemId: string) {
    setOrderDraft((prev) => prev.filter((d) => d.menuItem.id !== itemId));
  }

  async function submitOrder() {
    if (!selectedTab || orderDraft.length === 0) return;

    setSubmittingOrder(true);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tab_id: selectedTab.id,
        notes: orderNotes.trim() || null,
      })
      .select()
      .single();

    if (orderError) {
      setSubmittingOrder(false);
      toast({
        title: 'Error creating order',
        description: orderError.message,
        variant: 'destructive',
      });
      return;
    }

    // Create order items with price snapshot
    const orderItems = orderDraft.map((d) => ({
      order_id: order.id,
      menu_item_id: d.menuItem.id,
      quantity: d.quantity,
      price_at_order: d.menuItem.price,
      notes: d.notes.trim() || null,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    setSubmittingOrder(false);

    if (itemsError) {
      toast({
        title: 'Error adding items',
        description: itemsError.message,
        variant: 'destructive',
      });
      return;
    }

    // Clear draft and reload tabs
    setOrderDraft([]);
    setOrderNotes('');
    loadTabs();
    toast({
      title: 'Order sent to kitchen!',
      description: `${orderDraft.length} items submitted`,
    });
  }

  async function addMenuItem() {
    const price = parseFloat(newMenuItem.price);
    if (!newMenuItem.name.trim() || isNaN(price) || price < 0) {
      toast({
        title: 'Invalid menu item',
        description: 'Enter a valid name and price',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.from('menu_items').insert({
      name: newMenuItem.name.trim(),
      price,
      category: newMenuItem.category,
    });

    if (error) {
      toast({
        title: 'Error adding menu item',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setNewMenuItem({ name: '', price: '', category: 'Food' });
    setShowAddMenuItem(false);
    loadMenuItems();
    toast({ title: 'Menu item added' });
  }

  const orderTotal = orderDraft.reduce(
    (sum, d) => sum + d.menuItem.price * d.quantity,
    0
  );

  // Calculate tab total from all orders (FR-002)
  function calculateTabTotal(tab: TabWithOrders): number {
    return tab.orders.reduce(
      (total, order) =>
        total +
        order.order_items.reduce(
          (orderSum, item) => orderSum + item.quantity * item.price_at_order,
          0
        ),
      0
    );
  }

  // Calculate single order subtotal (FR-003)
  function calculateOrderSubtotal(order: OrderWithDetails): number {
    return order.order_items.reduce(
      (sum, item) => sum + item.quantity * item.price_at_order,
      0
    );
  }

  // Get status badge styling (FR-001)
  function getStatusBadge(status: Order['status']) {
    switch (status) {
      case 'complete':
        return {
          icon: CheckCircle,
          className: 'text-green-600 bg-green-100',
          label: 'Complete',
        };
      case 'editing':
        return {
          icon: AlertCircle,
          className: 'text-yellow-600 bg-yellow-100',
          label: 'Editing',
        };
      default:
        return {
          icon: Clock,
          className: 'text-blue-600 bg-blue-100',
          label: 'In Progress',
        };
    }
  }

  // Count unacknowledged ready orders for a tab
  function getReadyCount(tab: TabWithOrders): number {
    return tab.orders.filter(
      (o) => o.status === 'complete' && !acknowledgedOrders.has(o.id)
    ).length;
  }

  // Select tab and acknowledge its completed orders
  function selectTab(tab: TabWithOrders) {
    setSelectedTab(tab);
    const completeOrderIds = tab.orders
      .filter((o) => o.status === 'complete')
      .map((o) => o.id);
    if (completeOrderIds.length > 0) {
      setAcknowledgedOrders((prev) => {
        const next = new Set(prev);
        completeOrderIds.forEach((id) => next.add(id));
        return next;
      });
    }
    // On mobile, switch to menu view after selecting tab
    setMobileView('menu');
  }

  async function closeTab() {
    if (!selectedTab) return;

    const { error } = await supabase.rpc('close_tab', {
      p_tab_id: selectedTab.id,
    });

    if (error) {
      toast({
        title: 'Error closing tab',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setSelectedTab(null);
    setShowCloseConfirm(false);
    loadTabs();
    toast({
      title: 'Tab closed',
      description: `${selectedTab.name} has been closed`,
    });
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b p-4 flex items-center justify-between'>
        <h1 className='text-xl font-bold'>Front of House</h1>
        <div className='flex items-center gap-4'>
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
          <a
            href='#/kitchen'
            className='text-sm text-muted-foreground hover:text-foreground flex items-center gap-1'
          >
            <ChefHat className='w-4 h-4' /> Kitchen View
          </a>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => supabase.auth.signOut()}
            className='text-muted-foreground'
          >
            <LogOut className='w-4 h-4 mr-1' /> Sign Out
          </Button>
        </div>
      </header>

      <div className='flex flex-col md:flex-row h-[calc(100vh-65px)] pb-16 md:pb-0'>
        {/* Left: Tabs */}
        <div
          className={`${
            mobileView === 'tabs' ? 'flex' : 'hidden'
          } md:flex w-full md:w-64 border-r p-4 flex-col`}
        >
          <h2 className='font-semibold mb-3'>Open Tabs</h2>

          {/* Create new tab */}
          <div className='flex gap-2 mb-4'>
            <Input
              placeholder='Tab name...'
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createTab()}
            />
            <Button size='icon' onClick={createTab} disabled={creatingTab}>
              <Plus className='w-4 h-4' />
            </Button>
          </div>

          {/* Tab list */}
          <div className='flex-1 overflow-y-auto space-y-2'>
            {tabs.length === 0 && (
              <p className='text-sm text-muted-foreground'>No open tabs</p>
            )}
            {tabs.map((tab) => {
              const tabTotal = calculateTabTotal(tab);
              const readyCount = getReadyCount(tab);
              return (
                <Card
                  key={tab.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTab?.id === tab.id
                      ? 'border-primary bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => selectTab(tab)}
                >
                  <CardContent className='p-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium'>{tab.name}</span>
                        {readyCount > 0 && (
                          <span className='px-1.5 py-0.5 text-xs font-semibold bg-green-500 text-white rounded-full'>
                            {readyCount} ready
                          </span>
                        )}
                      </div>
                      <div className='font-semibold text-sm'>
                        ${tabTotal.toFixed(2)}
                      </div>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {tab.orders.length} order
                      {tab.orders.length !== 1 ? 's' : ''}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Center: Menu + Tab Details */}
        <div
          className={`${
            mobileView === 'menu' ? 'flex' : 'hidden'
          } md:flex flex-1 p-4 overflow-y-auto flex-col`}
        >
          {selectedTab ? (
            <>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='font-semibold'>Menu for {selectedTab.name}</h2>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowAddMenuItem(true)}
                >
                  <Plus className='w-4 h-4 mr-1' /> Add Item
                </Button>
              </div>

              {/* Menu grid */}
              {Object.entries(menuByCategory).map(([category, items]) => (
                <div key={category} className='mb-6'>
                  <h3 className='text-sm font-medium text-muted-foreground mb-2'>
                    {category}
                  </h3>
                  <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2'>
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        className='cursor-pointer hover:bg-accent/50 transition-colors min-w-20'
                        onClick={() => addToOrder(item)}
                      >
                        <CardContent className='p-3 wrap-break-word'>
                          <div className='font-medium text-sm'>{item.name}</div>
                          <div className='text-sm text-muted-foreground'>
                            ${item.price.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {menuItems.length === 0 && (
                <p className='text-muted-foreground'>
                  No menu items. Add some to get started.
                </p>
              )}
            </>
          ) : (
            <div className='flex items-center justify-center h-full text-muted-foreground'>
              Select or create a tab to start an order
            </div>
          )}
        </div>

        {/* Desktop Right Panel - always visible on desktop */}
        <div className='hidden md:flex md:w-80 border-l flex-col'>
          {/* Current Order */}
          <div className='h-2/3 p-4 flex flex-col border-b'>
            <h2 className='font-semibold mb-3'>Current Order</h2>

            {orderDraft.length === 0 ? (
              <p className='text-sm text-muted-foreground flex-1'>
                No items yet
              </p>
            ) : (
              <div className='flex-1 overflow-y-auto space-y-3'>
                {orderDraft.map((item) => (
                  <Card key={item.menuItem.id}>
                    <CardContent className='p-3'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='font-medium'>
                          {item.menuItem.name}
                        </span>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-6 w-6'
                          onClick={() => removeFromOrder(item.menuItem.id)}
                        >
                          <X className='w-3 h-3' />
                        </Button>
                      </div>
                      <div className='flex items-center gap-2 mb-2'>
                        <Button
                          variant='outline'
                          size='icon'
                          className='h-7 w-7'
                          onClick={() => updateQuantity(item.menuItem.id, -1)}
                        >
                          <Minus className='w-3 h-3' />
                        </Button>
                        <span className='w-8 text-center'>{item.quantity}</span>
                        <Button
                          variant='outline'
                          size='icon'
                          className='h-7 w-7'
                          onClick={() => updateQuantity(item.menuItem.id, 1)}
                        >
                          <Plus className='w-3 h-3' />
                        </Button>
                        <span className='ml-auto text-sm'>
                          ${(item.menuItem.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <Input
                        placeholder='Special requests...'
                        value={item.notes}
                        onChange={(e) =>
                          updateItemNotes(item.menuItem.id, e.target.value)
                        }
                        className='text-sm h-8'
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Order notes and submit */}
            {orderDraft.length > 0 && (
              <div className='border-t pt-4 mt-4 space-y-3'>
                <Input
                  placeholder='Order notes (optional)...'
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
                <div className='flex items-center justify-between text-lg font-semibold'>
                  <span>Total:</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
                <Button
                  className='w-full'
                  size='lg'
                  onClick={submitOrder}
                  disabled={submittingOrder || !selectedTab}
                >
                  <Send className='w-4 h-4 mr-2' />
                  {submittingOrder ? 'Sending...' : 'Send to Kitchen'}
                </Button>
              </div>
            )}
          </div>

          {/* Tab Orders */}
          <div className='h-1/3 flex flex-col bg-muted/30'>
            <h2 className='p-4 pb-2 font-semibold'>Tab Orders</h2>

            {selectedTab && selectedTab.orders.length > 0 ? (
              <>
                {/* Scrollable orders list */}
                <div className='flex-1 overflow-y-auto px-4'>
                  <div className='space-y-2'>
                    {selectedTab.orders.map((order) => {
                      const statusBadge = getStatusBadge(order.status);
                      const StatusIcon = statusBadge.icon;
                      const orderSubtotal = calculateOrderSubtotal(order);
                      const isActive = order.status !== 'complete';
                      const timingState = isActive
                        ? getTimingState(order.created_at)
                        : 'normal';
                      const timingClass = isActive
                        ? getTimingClass(timingState)
                        : '';

                      return (
                        <Card key={order.id} className='bg-background'>
                          <CardContent className='p-2'>
                            {/* Order header with status and timing */}
                            <div className='flex items-center justify-between mb-1'>
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
                              >
                                <StatusIcon className='w-3 h-3' />
                                {statusBadge.label}
                              </span>
                              {isActive ? (
                                <span className={`text-xs ${timingClass}`}>
                                  {formatElapsed(order.created_at, now)}
                                </span>
                              ) : (
                                order.completed_at && (
                                  <span className='text-xs text-muted-foreground'>
                                    {formatElapsed(order.completed_at, now)}
                                  </span>
                                )
                              )}
                            </div>

                            {/* Order items (compact) */}
                            <div className='text-xs text-muted-foreground'>
                              {order.order_items.map((item) => (
                                <span key={item.id} className='mr-2'>
                                  {item.quantity}x {item.menu_item.name}
                                </span>
                              ))}
                            </div>

                            {/* Order subtotal */}
                            <div className='text-right text-xs font-medium mt-1'>
                              ${orderSubtotal.toFixed(2)}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                {/* Sticky footer with total */}
                <div className='border-t p-4 bg-background'>
                  <div className='flex justify-between text-sm font-bold mb-2'>
                    <span>Total</span>
                    <span>${calculateTabTotal(selectedTab).toFixed(2)}</span>
                  </div>
                  <Button
                    variant='destructive'
                    size='sm'
                    className='w-full'
                    onClick={() => setShowCloseConfirm(true)}
                  >
                    Close Tab
                  </Button>
                </div>
              </>
            ) : (
              <p className='text-sm text-muted-foreground p-4'>
                {selectedTab ? 'No orders yet' : 'Select a tab'}
              </p>
            )}
          </div>
        </div>

        {/* Mobile Current Order - shown when viewing menu */}
        <div
          className={`${
            mobileView === 'menu' ? 'flex' : 'hidden'
          } md:hidden w-full h-1/2 flex-col border-t`}
        >
          <h2 className='p-4 pb-2 font-semibold'>Current Order</h2>

          {orderDraft.length === 0 ? (
            <p className='text-sm text-muted-foreground p-4'>No items yet</p>
          ) : (
            <>
              {/* Scrollable order items */}
              <div className='flex-1 overflow-y-auto px-4'>
                <div className='space-y-3 pb-4'>
                  {orderDraft.map((item) => (
                    <Card key={item.menuItem.id}>
                      <CardContent className='p-3'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='font-medium'>
                            {item.menuItem.name}
                          </span>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-6 w-6'
                            onClick={() => removeFromOrder(item.menuItem.id)}
                          >
                            <X className='w-3 h-3' />
                          </Button>
                        </div>
                        <div className='flex items-center gap-2 mb-2'>
                          <Button
                            variant='outline'
                            size='icon'
                            className='h-7 w-7'
                            onClick={() => updateQuantity(item.menuItem.id, -1)}
                          >
                            <Minus className='w-3 h-3' />
                          </Button>
                          <span className='w-8 text-center'>
                            {item.quantity}
                          </span>
                          <Button
                            variant='outline'
                            size='icon'
                            className='h-7 w-7'
                            onClick={() => updateQuantity(item.menuItem.id, 1)}
                          >
                            <Plus className='w-3 h-3' />
                          </Button>
                          <span className='ml-auto text-sm'>
                            ${(item.menuItem.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <Input
                          placeholder='Special requests...'
                          value={item.notes}
                          onChange={(e) =>
                            updateItemNotes(item.menuItem.id, e.target.value)
                          }
                          className='text-sm h-8'
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Sticky footer with total and submit */}
              <div className='border-t p-4 bg-background space-y-3'>
                <Input
                  placeholder='Order notes (optional)...'
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
                <div className='flex items-center justify-between text-lg font-semibold'>
                  <span>Total:</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
                <Button
                  className='w-full'
                  size='lg'
                  onClick={submitOrder}
                  disabled={submittingOrder || !selectedTab}
                >
                  <Send className='w-4 h-4 mr-2' />
                  {submittingOrder ? 'Sending...' : 'Send to Kitchen'}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Tab Orders - shown when viewing closeout */}
        <div
          className={`${
            mobileView === 'closeout' ? 'flex' : 'hidden'
          } md:hidden w-full flex-col bg-muted/30`}
        >
          <h2 className='p-4 pb-2 font-semibold'>Tab Orders</h2>

          {selectedTab && selectedTab.orders.length > 0 ? (
            <>
              {/* Scrollable orders list */}
              <div className='flex-1 overflow-y-auto px-4'>
                <div className='space-y-2'>
                  {selectedTab.orders.map((order) => {
                    const statusBadge = getStatusBadge(order.status);
                    const StatusIcon = statusBadge.icon;
                    const orderSubtotal = calculateOrderSubtotal(order);
                    const isActive = order.status !== 'complete';
                    const timingState = isActive
                      ? getTimingState(order.created_at)
                      : 'normal';
                    const timingClass = isActive
                      ? getTimingClass(timingState)
                      : '';

                    return (
                      <Card key={order.id} className='bg-background'>
                        <CardContent className='p-2'>
                          <div className='flex items-center justify-between mb-1'>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
                            >
                              <StatusIcon className='w-3 h-3' />
                              {statusBadge.label}
                            </span>
                            {isActive ? (
                              <span className={`text-xs ${timingClass}`}>
                                {formatElapsed(order.created_at, now)}
                              </span>
                            ) : (
                              order.completed_at && (
                                <span className='text-xs text-muted-foreground'>
                                  {formatElapsed(order.completed_at, now)}
                                </span>
                              )
                            )}
                          </div>

                          <div className='text-xs text-muted-foreground'>
                            {order.order_items.map((item) => (
                              <span key={item.id} className='mr-2'>
                                {item.quantity}x {item.menu_item.name}
                              </span>
                            ))}
                          </div>

                          <div className='text-right text-xs font-medium mt-1'>
                            ${orderSubtotal.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Sticky footer with total */}
              <div className='border-t p-4 bg-background'>
                <div className='flex justify-between text-sm font-bold mb-2'>
                  <span>Total</span>
                  <span>${calculateTabTotal(selectedTab).toFixed(2)}</span>
                </div>
                <Button
                  variant='destructive'
                  size='sm'
                  className='w-full'
                  onClick={() => setShowCloseConfirm(true)}
                >
                  Close Tab
                </Button>
              </div>
            </>
          ) : (
            <p className='text-sm text-muted-foreground p-4'>
              {selectedTab ? 'No orders yet' : 'Select a tab'}
            </p>
          )}
        </div>
      </div>

      {/* Add Menu Item Dialog */}
      <Dialog open={showAddMenuItem} onOpenChange={setShowAddMenuItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <Input
              placeholder='Item name'
              value={newMenuItem.name}
              onChange={(e) =>
                setNewMenuItem((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              type='number'
              step='0.01'
              placeholder='Price'
              value={newMenuItem.price}
              onChange={(e) =>
                setNewMenuItem((prev) => ({ ...prev, price: e.target.value }))
              }
            />
            <select
              className='w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm'
              value={newMenuItem.category}
              onChange={(e) =>
                setNewMenuItem((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
            >
              <option value='Skewers'>Skewers</option>
              <option value='Drinks'>Drinks</option>
              <option value='Dessert'>Dessert</option>
              <option value='Other'>Other</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowAddMenuItem(false)}>
              Cancel
            </Button>
            <Button onClick={addMenuItem}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation - Mobile Only */}
      <nav className='md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50'>
        <div className='flex'>
          <button
            onClick={() => setMobileView('tabs')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mobileView === 'tabs'
                ? 'text-primary border-t-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tabs
          </button>
          <button
            onClick={() => setMobileView('menu')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mobileView === 'menu'
                ? 'text-primary border-t-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => setMobileView('closeout')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              mobileView === 'closeout'
                ? 'text-primary border-t-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Close out
          </button>
        </div>
      </nav>

      {/* Close Tab Confirmation Dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Tab?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTab && (
                <>
                  Are you sure you want to close "{selectedTab.name}"?
                  {selectedTab.orders.some((o) => o.status !== 'complete') && (
                    <span className='block mt-2 text-yellow-600 font-medium'>
                      Warning: This tab has incomplete orders.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={closeTab}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Close Tab
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
