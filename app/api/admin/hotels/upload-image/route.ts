import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const hotelSlug = formData.get('hotelSlug') as string;

    if (!file || !hotelSlug) {
      return NextResponse.json({ error: 'Missing file or hotelSlug', file: !!file, hotelSlug }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type: ${file.type}. Use JPG, PNG or WebP.` }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max 5MB.` }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${hotelSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Upload to storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('hotel-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('STORAGE UPLOAD ERROR:', JSON.stringify(uploadError));
      return NextResponse.json({
        error: `Storage error: ${uploadError.message}`,
        details: uploadError,
        step: 'storage_upload',
      }, { status: 500 });
    }

    console.log('Upload success:', uploadData);

    // Step 2: Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('hotel-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('Public URL:', publicUrl);

    // Step 3: Read current images from DB
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('hotel_settings')
      .select('images')
      .eq('hotel_slug', hotelSlug)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('FETCH ERROR:', JSON.stringify(fetchError));
    }

    // Parse existing images safely
    let currentImages: string[] = [];
    if (existing?.images) {
      if (Array.isArray(existing.images)) {
        currentImages = existing.images;
      } else if (typeof existing.images === 'string') {
        try { currentImages = JSON.parse(existing.images); } catch { currentImages = []; }
      }
    }

    const newImages = [...currentImages, publicUrl];

    // Step 4: Save back to DB
    const { error: updateError } = await supabaseAdmin
      .from('hotel_settings')
      .upsert(
        {
          hotel_slug: hotelSlug,
          hotel_name: hotelSlug,
          images: newImages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'hotel_slug' }
      );

    if (updateError) {
      console.error('DB UPDATE ERROR:', JSON.stringify(updateError));
      return NextResponse.json({
        error: `DB error: ${updateError.message}`,
        details: updateError,
        step: 'db_update',
        // Still return the URL so image isn't lost
        url: publicUrl,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      images: newImages,
      count: newImages.length,
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('UPLOAD ROUTE CRASH:', message);
    return NextResponse.json({ error: `Server crash: ${message}`, step: 'unknown' }, { status: 500 });
  }
}