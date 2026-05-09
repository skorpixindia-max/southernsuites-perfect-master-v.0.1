'use client';
import { useState, useEffect, useRef } from 'react';
import { HOTELS } from '@/lib/hotels-data';
import { Edit2, Check, X, Plus, Trash2, ExternalLink, ChevronDown, ChevronUp, Upload, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoomOverride {
  id: string; name: string; price: number; originalPrice: number;
  size: string; beds: string; view: string; maxGuests: number;
  amenities: string[]; description: string; images?: string[];
}
interface HotelOverride {
  name?: string; phone?: string; description?: string; maps_link?: string;
  amenities?: string[]; highlights?: string[]; rooms?: RoomOverride[]; images?: string[];
}

export default function AdminHotels() {
  const [overrides, setOverrides] = useState<Record<string, HotelOverride>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [newAmenity, setNewAmenity] = useState<Record<string, string>>({});
  const [newHighlight, setNewHighlight] = useState<Record<string, string>>({});
  const [newRoomName, setNewRoomName] = useState<Record<string, string>>({});
  const hotelFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const roomFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch('/api/admin/hotels/get-all')
      .then(r => r.json())
      .then(data => { if (data) setOverrides(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function getHotelData(hotelId: string, slug: string) {
    const hotel = HOTELS.find(h => h.id === hotelId)!;
    const ov = overrides[slug] || {};
    return {
      name: ov.name ?? hotel.name,
      phone: ov.phone ?? hotel.phone,
      description: ov.description ?? hotel.description,
      maps_link: ov.maps_link ?? hotel.mapsLink,
      amenities: ov.amenities ?? hotel.amenities,
      highlights: ov.highlights ?? hotel.highlights,
      images: ov.images ?? [],
      rooms: ov.rooms ?? hotel.rooms.map(r => ({
        id: r.id, name: r.name, price: r.price,
        originalPrice: r.originalPrice || r.price,
        size: r.size, beds: r.beds, view: r.view,
        maxGuests: r.maxGuests, amenities: r.amenities,
        description: r.description, images: [],
      })),
    };
  }

  async function saveHotel(slug: string) {
    const data = overrides[slug];
    const res = await fetch('/api/admin/hotels/update', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelSlug: slug, ...data }),
    });
    if (res.ok) { toast.success('Saved! Live on website.'); setEditing({ ...editing, [slug]: false }); }
    else toast.error('Failed to save');
  }

  async function uploadHotelImage(slug: string, file: File) {
    setUploading({ ...uploading, [slug]: true });
    const fd = new FormData();
    fd.append('file', file); fd.append('hotelSlug', slug);
    const res = await fetch('/api/admin/hotels/upload-image', { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok) {
      toast.success('Image uploaded!');
      setOverrides(prev => ({ ...prev, [slug]: { ...prev[slug], images: data.images } }));
    } else toast.error('Upload failed');
    setUploading({ ...uploading, [slug]: false });
  }

  async function deleteHotelImage(slug: string, url: string) {
    const res = await fetch('/api/admin/hotels/delete-image', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hotelSlug: slug, imageUrl: url }),
    });
    const data = await res.json();
    if (res.ok) { toast.success('Deleted'); setOverrides(prev => ({ ...prev, [slug]: { ...prev[slug], images: data.images } })); }
    else toast.error('Delete failed');
  }

  async function uploadRoomImage(slug: string, hotelId: string, roomId: string, file: File) {
    setUploading({ ...uploading, [`${slug}-${roomId}`]: true });
    const fd = new FormData();
    fd.append('file', file); fd.append('hotelSlug', slug); fd.append('roomId', roomId);
    const res = await fetch('/api/admin/hotels/upload-room-image', { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok) {
      toast.success('Room image uploaded!');
      const rooms = [...getHotelData(hotelId, slug).rooms];
      const idx = rooms.findIndex(r => r.id === roomId);
      if (idx !== -1) {
        rooms[idx] = { ...rooms[idx], images: [...(rooms[idx].images || []), data.url] };
        setOverrides(prev => ({ ...prev, [slug]: { ...prev[slug], rooms } }));
      }
    } else toast.error('Upload failed');
    setUploading({ ...uploading, [`${slug}-${roomId}`]: false });
  }

  function deleteRoomImage(slug: string, hotelId: string, roomId: string, url: string) {
    const rooms = [...getHotelData(hotelId, slug).rooms];
    const idx = rooms.findIndex(r => r.id === roomId);
    if (idx === -1) return;
    rooms[idx] = { ...rooms[idx], images: (rooms[idx].images || []).filter(i => i !== url) };
    setOverrides(prev => ({ ...prev, [slug]: { ...prev[slug], rooms } }));
    toast.success('Image removed');
  }

  function updateField(slug: string, field: string, value: unknown) {
    setOverrides(prev => ({ ...prev, [slug]: { ...prev[slug], [field]: value } }));
  }

  function addAmenity(slug: string, hotelId: string) {
    const val = newAmenity[slug]?.trim(); if (!val) return;
    updateField(slug, 'amenities', [...getHotelData(hotelId, slug).amenities, val]);
    setNewAmenity({ ...newAmenity, [slug]: '' });
  }

  function removeAmenity(slug: string, hotelId: string, i: number) {
    const a = [...getHotelData(hotelId, slug).amenities]; a.splice(i, 1);
    updateField(slug, 'amenities', a);
  }

  function addHighlight(slug: string, hotelId: string) {
    const val = newHighlight[slug]?.trim(); if (!val) return;
    updateField(slug, 'highlights', [...getHotelData(hotelId, slug).highlights, val]);
    setNewHighlight({ ...newHighlight, [slug]: '' });
  }

  function removeHighlight(slug: string, hotelId: string, i: number) {
    const h = [...getHotelData(hotelId, slug).highlights]; h.splice(i, 1);
    updateField(slug, 'highlights', h);
  }

  function updateRoom(slug: string, hotelId: string, roomId: string, field: string, value: unknown) {
    const rooms = [...getHotelData(hotelId, slug).rooms];
    const idx = rooms.findIndex(r => r.id === roomId); if (idx === -1) return;
    rooms[idx] = { ...rooms[idx], [field]: value };
    updateField(slug, 'rooms', rooms);
  }

  function addRoomAmenity(slug: string, hotelId: string, roomId: string, val: string) {
    if (!val.trim()) return;
    const rooms = [...getHotelData(hotelId, slug).rooms];
    const idx = rooms.findIndex(r => r.id === roomId); if (idx === -1) return;
    rooms[idx] = { ...rooms[idx], amenities: [...rooms[idx].amenities, val.trim()] };
    updateField(slug, 'rooms', rooms);
  }

  function removeRoomAmenity(slug: string, hotelId: string, roomId: string, ai: number) {
    const rooms = [...getHotelData(hotelId, slug).rooms];
    const idx = rooms.findIndex(r => r.id === roomId); if (idx === -1) return;
    const amenities = [...rooms[idx].amenities]; amenities.splice(ai, 1);
    rooms[idx] = { ...rooms[idx], amenities };
    updateField(slug, 'rooms', rooms);
  }

  function addRoom(slug: string, hotelId: string) {
    const name = newRoomName[slug]?.trim(); if (!name) return;
    const rooms = [...getHotelData(hotelId, slug).rooms];
    rooms.push({ id: `${slug}-room-${Date.now()}`, name, price: 2000, originalPrice: 2500, size: '250 sq.ft', beds: '1 King Bed', view: 'City View', maxGuests: 2, amenities: ['AC', 'Wi-Fi', 'TV', 'Hot & Cold Water'], description: '', images: [] });
    updateField(slug, 'rooms', rooms);
    setNewRoomName({ ...newRoomName, [slug]: '' });
  }

  function removeRoom(slug: string, hotelId: string, roomId: string) {
    updateField(slug, 'rooms', getHotelData(hotelId, slug).rooms.filter(r => r.id !== roomId));
  }

  if (loading) return <div className="p-8 text-center text-xs text-gray-400 font-sans">Loading...</div>;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-brand-rich">Manage Hotels</h1>
        <p className="text-xs text-gray-500 font-sans mt-1">All changes reflect instantly on the website after saving.</p>
      </div>
      <div className="space-y-4">
        {HOTELS.map(hotel => {
          const slug = hotel.slug;
          const data = getHotelData(hotel.id, slug);
          const isExpanded = expanded === slug;
          const isEditing = editing[slug];
          return (
            <div key={hotel.id} className="bg-white border border-gold-border">
              <div className="flex items-center justify-between px-5 py-4 bg-brand-black cursor-pointer" onClick={() => setExpanded(isExpanded ? null : slug)}>
                <div className="text-gold font-serif text-sm">{data.name}</div>
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  <a href={`/hotels/${slug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gold/50 hover:text-gold font-sans flex items-center gap-1"><ExternalLink size={11} /> View</a>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveHotel(slug)} className="bg-gold text-brand-black px-3 py-1 text-[10px] font-sans flex items-center gap-1"><Check size={11} /> Save All</button>
                      <button onClick={() => setEditing({ ...editing, [slug]: false })} className="bg-gray-600 text-white p-1.5"><X size={13} /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditing({ ...editing, [slug]: true }); setExpanded(slug); }} className="text-[10px] text-gold font-sans flex items-center gap-1 border border-gold px-2 py-1"><Edit2 size={11} /> Edit</button>
                  )}
                  {isExpanded ? <ChevronUp size={14} className="text-gold" /> : <ChevronDown size={14} className="text-gold" />}
                </div>
              </div>

              {isExpanded && (
                <div className="p-5 space-y-6">

                  {/* Hotel Images */}
                  <div>
                    <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-3">Hotel Photos</div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-2">
                      {data.images.map((img, i) => (
                        <div key={i} className="relative group aspect-square">
                          <img src={img} alt="" className="w-full h-full object-cover border border-gold-border" />
                          <button onClick={() => deleteHotelImage(slug, img)} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                        </div>
                      ))}
                      <div className="aspect-square border-2 border-dashed border-gold-border flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors" onClick={() => hotelFileRefs.current[slug]?.click()}>
                        {uploading[slug] ? <div className="text-[9px] text-gray-400 font-sans">...</div> : <><Upload size={14} className="text-gold mb-1" /><div className="text-[9px] text-gray-400 font-sans">Add</div></>}
                      </div>
                    </div>
                    <input type="file" accept="image/*" multiple className="hidden" ref={el => { hotelFileRefs.current[slug] = el; }}
                      onChange={async e => { for (const f of Array.from(e.target.files || [])) await uploadHotelImage(slug, f); e.target.value = ''; }} />
                    {data.images.length === 0 && <div className="text-[10px] text-gray-400 font-sans flex items-center gap-1"><ImageIcon size={11} /> No hotel photos yet</div>}
                  </div>

                  {/* Basic Info */}
                  <div>
                    <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-3">Basic Information</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
  { label: 'Hotel Name', field: 'name', value: data.name },
  { label: 'Phone', field: 'phone', value: data.phone },
  { label: 'Google Maps Link', field: 'maps_link', value: data.maps_link, full: true },
  { label: 'Google Place ID', field: 'place_id', value: hotel.placeId, full: true, readonly: true },
].map(f => (
  <div key={f.field} className={f.full ? 'md:col-span-2' : ''}>
    <label className="text-[9px] text-gray-400 uppercase tracking-widest font-sans block mb-1">{f.label}</label>
    {f.readonly ? (
      <div className="text-xs font-mono text-gold-dark bg-gold-tint border border-gold-border px-3 py-2 select-all">{f.value}</div>
    ) : isEditing ? (
      <input value={f.value || ''} onChange={e => updateField(slug, f.field, e.target.value)} className="w-full border border-gold-border text-sm px-3 py-2 font-sans outline-none" />
    ) : (
      <div className="text-sm font-sans text-brand-rich truncate">{f.value}</div>
    )}
  </div>
))}
                      <div className="md:col-span-2">
                        <label className="text-[9px] text-gray-400 uppercase tracking-widest font-sans block mb-1">Description</label>
                        {isEditing ? <textarea value={data.description || ''} onChange={e => updateField(slug, 'description', e.target.value)} rows={3} className="w-full border border-gold-border text-sm px-3 py-2 font-sans outline-none resize-none" />
                          : <div className="text-xs font-sans text-gray-600 leading-6">{data.description}</div>}
                      </div>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-3">Amenities</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {data.amenities.map((a, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] border border-gold-border text-gold-dark px-2 py-1 font-sans">
                          {a}{isEditing && <button onClick={() => removeAmenity(slug, hotel.id, i)} className="text-red-400 ml-1"><X size={9} /></button>}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <input value={newAmenity[slug] || ''} onChange={e => setNewAmenity({ ...newAmenity, [slug]: e.target.value })} placeholder="e.g. Swimming Pool" className="flex-1 border border-gold-border text-xs px-3 py-1.5 font-sans outline-none" onKeyDown={e => e.key === 'Enter' && addAmenity(slug, hotel.id)} />
                        <button onClick={() => addAmenity(slug, hotel.id)} className="bg-gold text-brand-black px-3 py-1.5 text-xs font-sans flex items-center gap-1"><Plus size={11} /> Add</button>
                      </div>
                    )}
                  </div>

                  {/* Highlights */}
                  <div>
                    <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-3">Highlights</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {data.highlights.map((h, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] border border-gold-border text-brand-rich px-2 py-1 font-sans">
                          {h}{isEditing && <button onClick={() => removeHighlight(slug, hotel.id, i)} className="text-red-400 ml-1"><X size={9} /></button>}
                        </span>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <input value={newHighlight[slug] || ''} onChange={e => setNewHighlight({ ...newHighlight, [slug]: e.target.value })} placeholder="e.g. Rooftop Pool" className="flex-1 border border-gold-border text-xs px-3 py-1.5 font-sans outline-none" onKeyDown={e => e.key === 'Enter' && addHighlight(slug, hotel.id)} />
                        <button onClick={() => addHighlight(slug, hotel.id)} className="bg-gold text-brand-black px-3 py-1.5 text-xs font-sans flex items-center gap-1"><Plus size={11} /> Add</button>
                      </div>
                    )}
                  </div>

                  {/* Rooms */}
                  <div>
                    <div className="text-[9px] text-gold-dark uppercase tracking-widest font-sans mb-3">Rooms</div>
                    <div className="space-y-4">
                      {data.rooms.map((room) => (
                        <div key={room.id} className="border border-gold-border p-4">
                          <div className="flex items-center justify-between mb-3">
                            {isEditing ? <input value={room.name} onChange={e => updateRoom(slug, hotel.id, room.id, 'name', e.target.value)} className="border border-gold text-sm px-2 py-1 font-sans outline-none font-serif" />
                              : <div className="font-serif text-sm text-brand-rich">{room.name}</div>}
                            {isEditing && <button onClick={() => removeRoom(slug, hotel.id, room.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button>}
                          </div>

                          {/* Room Images */}
                          <div className="mb-4">
                            <div className="text-[9px] text-gray-400 uppercase tracking-widest font-sans mb-2">Room Photos</div>
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                              {(room.images || []).map((img, ii) => (
                                <div key={ii} className="relative group aspect-square">
                                  <img src={img} alt="" className="w-full h-full object-cover border border-gold-border" />
                                  <button onClick={() => deleteRoomImage(slug, hotel.id, room.id, img)} className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={9} /></button>
                                </div>
                              ))}
                              <div className="aspect-square border-2 border-dashed border-gold-border flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors text-center"
                                onClick={() => roomFileRefs.current[`${slug}-${room.id}`]?.click()}>
                                {uploading[`${slug}-${room.id}`] ? <div className="text-[8px] text-gray-400">...</div> : <><Upload size={10} className="text-gold mb-0.5" /><div className="text-[8px] text-gray-400 font-sans">Add</div></>}
                              </div>
                            </div>
                            <input type="file" accept="image/*" multiple className="hidden"
                              ref={el => { roomFileRefs.current[`${slug}-${room.id}`] = el; }}
                              onChange={async e => { for (const f of Array.from(e.target.files || [])) await uploadRoomImage(slug, hotel.id, room.id, f); e.target.value = ''; }} />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            {[
                              { label: 'Price/Night (₹)', field: 'price', value: room.price, type: 'number' },
                              { label: 'Original (₹)', field: 'originalPrice', value: room.originalPrice, type: 'number' },
                              { label: 'Size', field: 'size', value: room.size, type: 'text' },
                              { label: 'Beds', field: 'beds', value: room.beds, type: 'text' },
                              { label: 'View', field: 'view', value: room.view, type: 'text' },
                              { label: 'Max Guests', field: 'maxGuests', value: room.maxGuests, type: 'number' },
                            ].map(f => (
                              <div key={f.field}>
                                <label className="text-[9px] text-gray-400 uppercase tracking-widest font-sans block mb-1">{f.label}</label>
                                {isEditing ? <input type={f.type} value={f.value} onChange={e => updateRoom(slug, hotel.id, room.id, f.field, f.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)} className="w-full border border-gold-border text-xs px-2 py-1.5 font-sans outline-none" />
                                  : <div className="text-xs font-sans text-brand-rich">{f.value}</div>}
                              </div>
                            ))}
                          </div>

                          <div>
                            <label className="text-[9px] text-gray-400 uppercase tracking-widest font-sans block mb-2">Room Amenities</label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {room.amenities.map((a, ai) => (
                                <span key={ai} className="flex items-center gap-1 text-[9px] border border-gold-border text-gold-dark px-2 py-0.5 font-sans">
                                  {a}{isEditing && <button onClick={() => removeRoomAmenity(slug, hotel.id, room.id, ai)} className="text-red-400 ml-1"><X size={8} /></button>}
                                </span>
                              ))}
                            </div>
                            {isEditing && (
                              <div className="flex gap-2">
                                <input id={`ra-${room.id}`} placeholder="e.g. Minibar" className="flex-1 border border-gold-border text-[10px] px-2 py-1 font-sans outline-none"
                                  onKeyDown={e => { if (e.key === 'Enter') { addRoomAmenity(slug, hotel.id, room.id, (e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
                                <button onClick={() => { const el = document.getElementById(`ra-${room.id}`) as HTMLInputElement; addRoomAmenity(slug, hotel.id, room.id, el.value); el.value = ''; }} className="bg-gold text-brand-black px-2 py-1 text-[10px] font-sans"><Plus size={10} /></button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {isEditing && (
                      <div className="flex gap-2 mt-3">
                        <input value={newRoomName[slug] || ''} onChange={e => setNewRoomName({ ...newRoomName, [slug]: e.target.value })} placeholder="New room name (e.g. Deluxe Suite)" className="flex-1 border border-gold-border text-xs px-3 py-2 font-sans outline-none" />
                        <button onClick={() => addRoom(slug, hotel.id)} className="bg-brand-black text-gold px-4 py-2 text-xs font-sans flex items-center gap-1"><Plus size={11} /> Add Room</button>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
