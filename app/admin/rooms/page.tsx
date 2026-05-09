'use client';
import { useState, useEffect } from 'react';
import { HOTELS } from '@/lib/hotels-data';
import { formatCurrency } from '@/lib/utils';
import { Edit2, Check, X } from 'lucide-react';
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

  useEffect(() => {
    // Load inventory from Supabase
    fetch('/api/admin/rooms/get-inventory')
      .then(r => r.json())
      .then(data => { if (data.inventory) setInventory(data.inventory); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

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

    // Save price
    const priceRes = await fetch('/api/admin/rooms/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, price: data.price, originalPrice: data.originalPrice }),
    });

    // Save inventory
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

  function update(roomId: string, field: string, value: number) {
    setRoomData(prev => ({ ...prev, [roomId]: { ...prev[roomId], [field]: value } }));
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
                          <button onClick={() => startEdit(room)} className="btn-black text-[10px] px-3 py-2 flex items-center gap-1.5">
                            <Edit2 size={11} /> Edit
                          </button>
                        )}
                      </div>
                    </div>
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
