'use client';
import { useState, useEffect } from 'react';
import { HOTELS } from '@/lib/hotels-data';
import { formatCurrency } from '@/lib/utils';
import { Edit2, Check, X, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoomData {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  totalRooms: number;
}

export default function AdminRooms() {
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<Record<string, RoomData>>({});
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [calendarRoom, setCalendarRoom] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [bookedDates, setBookedDates] = useState<Record<string, number>>({});
  const [loadingCal, setLoadingCal] = useState(false);

  useEffect(() => {
    fetch('/api/admin/rooms/get-inventory')
      .then(r => r.json())
      .then(data => { if (data.inventory) setInventory(data.inventory); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function update(roomId: string, field: keyof RoomData, value: number) {
    setRoomData(prev => ({ ...prev, [roomId]: { ...prev[roomId], [field]: value } }));
  }

  function startEdit(room: { id: string; name: string; price: number; originalPrice?: number }) {
    setEditingRoom(room.id);
    setRoomData(prev => ({
      ...prev,
      [room.id]: {
        id: room.id,
        name: room.name,
        price: prev[room.id]?.price ?? room.price,
        originalPrice: prev[room.id]?.originalPrice ?? (room.originalPrice || room.price),
        totalRooms: inventory[room.id] ?? 1,
      }
    }));
  }

  async function saveRoom(roomId: string, hotelSlug: string) {
    const data = roomData[roomId];
    if (!data) return;

    const priceRes = await fetch('/api/admin/rooms/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, price: data.price, originalPrice: data.originalPrice }),
    });

    const invRes = await fetch('/api/admin/rooms/update-inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, hotelSlug, totalRooms: data.totalRooms }),
    });

    if (priceRes.ok && invRes.ok) {
      toast.success('Room updated — live on website');
      setInventory(prev => ({ ...prev, [roomId]: data.totalRooms }));
      setEditingRoom(null);
    } else {
      toast.error('Failed to update');
    }
  }

  async function openCalendar(roomId: string, hotelSlug: string) {
    if (calendarRoom === roomId) { setCalendarRoom(null); return; }
    setCalendarRoom(roomId);
    setLoadingCal(true);
    try {
      const res = await fetch(`/api/admin/rooms/get-inventory?roomId=${roomId}&hotelSlug=${hotelSlug}&calendar=true`);
      const data = await res.json();
      setBookedDates(data.bookedDates || {});
    } catch { setBookedDates({}); }
    finally { setLoadingCal(false); }
  }

  function getCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }

  function getDateStr(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  if (loading) return <div className="p-8 text-center text-xs text-gray-400 font-sans">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-brand-rich">Rooms & Rates</h1>
        <p className="text-xs text-gray-500 font-sans mt-1">Edit room prices and total room count. Changes reflect instantly on website.</p>
      </div>

      <div className="space-y-6">
        {HOTELS.map(hotel => (
          <div key={hotel.id} className="bg-white border border-gold-border">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gold-border bg-brand-black">
              <div className="text-gold font-serif text-sm">{hotel.name}</div>
              <span className="text-[9px] text-gold/40 font-sans uppercase tracking-widest">· {hotel.rooms.length} room type{hotel.rooms.length > 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-gold-border">
              {hotel.rooms.map(room => {
                const isEditing = editingRoom === room.id;
                const data = roomData[room.id];
                const totalRooms = inventory[room.id] ?? 1;
                const currentPrice = data?.price ?? room.price;
                const currentOriginal = data?.originalPrice ?? (room.originalPrice || room.price);
                return (
                  <div key={room.id} className="px-5 py-4">
                    {/* Room row */}
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-serif text-brand-rich mb-1">{room.name}</div>
                        <div className="flex flex-wrap gap-3 text-[10px] text-gray-400 font-sans mb-2">
                          <span>{room.size}</span><span>·</span>
                          <span>{room.beds}</span><span>·</span>
                          <span>{room.view}</span><span>·</span>
                          <span>Max {room.maxGuests} guests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${totalRooms > 3 ? 'bg-green-500' : totalRooms > 0 ? 'bg-orange-400' : 'bg-red-500'}`} />
                          <span className="text-[10px] font-sans text-gray-500">{totalRooms} room{totalRooms !== 1 ? 's' : ''} total in inventory</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {isEditing ? (
                          <div className="flex items-center gap-3 flex-wrap">
                            <div>
                              <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Rate/Night (₹)</div>
                              <input type="number" value={data?.price ?? ''} onChange={e => update(room.id, 'price', parseInt(e.target.value) || 0)}
                                className="w-24 border border-gold text-sm px-3 py-1.5 font-sans outline-none" />
                            </div>
                            <div>
                              <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Original (₹)</div>
                              <input type="number" value={data?.originalPrice ?? ''} onChange={e => update(room.id, 'originalPrice', parseInt(e.target.value) || 0)}
                                className="w-24 border border-gold-border text-sm px-3 py-1.5 font-sans outline-none" />
                            </div>
                            <div>
                              <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-1">Total Rooms</div>
                              <input type="number" min="0" max="100" value={data?.totalRooms ?? totalRooms} onChange={e => update(room.id, 'totalRooms', parseInt(e.target.value) || 0)}
                                className="w-20 border border-gold-border text-sm px-3 py-1.5 font-sans outline-none" />
                            </div>
                            <div className="flex gap-1 mt-4">
                              <button onClick={() => saveRoom(room.id, hotel.slug)} className="bg-gold text-brand-black p-1.5"><Check size={13} /></button>
                              <button onClick={() => setEditingRoom(null)} className="bg-gray-100 text-gray-600 p-1.5"><X size={13} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-right">
                            {currentOriginal > currentPrice && (
                              <div className="text-xs text-gray-400 line-through font-sans">{formatCurrency(currentOriginal)}</div>
                            )}
                            <div className="font-serif text-xl text-brand-rich">{formatCurrency(currentPrice)}</div>
                            <div className="text-[10px] text-gray-400 font-sans">/night</div>
                            <div className="text-[10px] text-gray-500 font-sans mt-1">{totalRooms} room{totalRooms !== 1 ? 's' : ''} available</div>
                          </div>
                        )}
                        {!isEditing && (
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(room)} className="btn-black text-[10px] px-3 py-2 flex items-center gap-1.5">
                              <Edit2 size={11} /> Edit
                            </button>
                            <button onClick={() => openCalendar(room.id, hotel.slug)} className="border border-gold text-gold text-[10px] px-3 py-2 flex items-center gap-1.5 hover:bg-gold hover:text-brand-black transition-colors">
                              <Lock size={11} /> Availability
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Calendar — inside the room div, inside the map return */}
                    {calendarRoom === room.id && (
                      <div className="mt-4 border-t border-gold-border pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-serif text-brand-rich">
                            {new Date(calendarMonth.year, calendarMonth.month).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setCalendarMonth(p => {
                              const d = new Date(p.year, p.month - 1);
                              return { year: d.getFullYear(), month: d.getMonth() };
                            })} className="p-1 hover:bg-gold-tint"><ChevronLeft size={14} /></button>
                            <button onClick={() => setCalendarMonth(p => {
                              const d = new Date(p.year, p.month + 1);
                              return { year: d.getFullYear(), month: d.getMonth() };
                            })} className="p-1 hover:bg-gold-tint"><ChevronRight size={14} /></button>
                          </div>
                        </div>

                        {loadingCal ? (
                          <div className="text-xs text-gray-400 font-sans py-4 text-center">Loading calendar…</div>
                        ) : (
                          <>
                            <div className="grid grid-cols-7 gap-0.5 mb-1">
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="text-center text-[9px] text-gray-400 font-sans py-1">{d}</div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5">
                              {getCalendarDays(calendarMonth.year, calendarMonth.month).map((day, idx) => {
                                if (!day) return <div key={idx} />;
                                const dateStr = getDateStr(calendarMonth.year, calendarMonth.month, day);
                                const booked = bookedDates[dateStr] || 0;
                                const total = inventory[room.id] ?? 1;
                                const available = Math.max(0, total - booked);
                                const today = new Date().toISOString().split('T')[0];
                                const isPast = dateStr < today;
                                const isFullyBooked = available === 0 && total > 0;
                                return (
                                  <div key={idx} className={`text-center py-1.5 text-[10px] font-sans rounded-sm ${
                                    isPast ? 'text-gray-300' :
                                    isFullyBooked ? 'bg-red-50 text-red-500 font-semibold' :
                                    booked > 0 ? 'bg-amber-50 text-amber-600' :
                                    'bg-green-50 text-green-600'
                                  }`}>
                                    <div>{day}</div>
                                    {!isPast && total > 0 && (
                                      <div className="text-[8px] leading-none mt-0.5">
                                        {available}/{total}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <div className="flex gap-4 mt-3">
                              {[
                                { color: 'bg-green-50 text-green-600', label: 'Available' },
                                { color: 'bg-amber-50 text-amber-600', label: 'Partial' },
                                { color: 'bg-red-50 text-red-500', label: 'Fully Booked' },
                              ].map(l => (
                                <div key={l.label} className="flex items-center gap-1.5">
                                  <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                                  <span className="text-[9px] text-gray-400 font-sans">{l.label}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}