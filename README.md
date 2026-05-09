# Hotel Southern Suites — Complete Website

**Production-ready hotel booking website for 9 properties across AP & Telangana.**

---

## 🚀 Quick Start (5 Steps)

### Step 1 — Install dependencies
```bash
cd southern-suites
npm install
```

### Step 2 — Setup Supabase (Free)
1. Go to [supabase.com](https://supabase.com) → Create free account → New Project
2. Go to **SQL Editor** → Paste contents of `lib/schema.sql` → Run it
3. Go to **Settings → API** → Copy your Project URL and anon key

### Step 3 — Configure environment
```bash
cp .env.local.example .env.local
```
Then open `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
SUPER_ADMIN_EMAIL=owner@southernsuites.com
SUPER_ADMIN_PASSWORD=YourStrongPassword123
ADMIN_SECRET_KEY=any-random-string-here
```

### Step 4 — Add your hero video
Copy your video file to:
```
public/images/hero-video.mp4
```

### Step 5 — Run the project
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel (Free)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Add all environment variables from `.env.local`
4. Deploy — your site is live!

**Domain:** Buy from Namecheap (~₹800/year) or GoDaddy. Connect in Vercel dashboard.

---

## 🔑 Admin Panel

URL: `yourdomain.com/admin/login`

**Super Admin** (owner) — full access to all 9 properties:
- Login with `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` from `.env.local`

**Branch Manager** — limited access (their property only):
- Create from Admin Panel → Branch Managers

### What Owner Can Do From Admin:
- ✅ View all bookings across all 9 properties
- ✅ Edit hotel names, descriptions, addresses
- ✅ Change room rates instantly (live on website)
- ✅ Add/remove branch manager accounts
- ✅ Export all bookings as CSV
- ✅ Plug in Razorpay live keys when ready
- ✅ Change hero video, tagline, WhatsApp number
- ✅ Download invoice PDF for any booking

---

## 💳 Razorpay Setup (When Ready)

1. Go to [razorpay.com](https://razorpay.com) → Create account
2. Get API keys from Dashboard → Settings → API Keys
3. Go to Admin Panel → Settings → Paste keys → Save
4. Test with Razorpay test cards first, then switch to live

**Test card:** 4111 1111 1111 1111 | Expiry: any future date | CVV: any 3 digits

---

## 📧 Email Setup (Resend - Free 100/day)

1. Go to [resend.com](https://resend.com) → Create free account
2. Add your domain (or use their free domain for testing)
3. Copy API key → Add to `.env.local` as `RESEND_API_KEY`

---

## 📁 Project Structure

```
southern-suites/
├── app/
│   ├── page.tsx                    ← Homepage
│   ├── hotels/[slug]/page.tsx      ← Individual hotel page
│   ├── booking/[slug]/page.tsx     ← Booking flow
│   ├── confirmation/[id]/page.tsx  ← Booking confirmation + invoice
│   ├── admin/
│   │   ├── login/page.tsx          ← Admin login
│   │   ├── dashboard/page.tsx      ← Stats overview
│   │   ├── hotels/page.tsx         ← Edit hotel content
│   │   ├── rooms/page.tsx          ← Edit room rates
│   │   ├── bookings/page.tsx       ← All bookings + export
│   │   ├── managers/page.tsx       ← Branch manager accounts
│   │   └── settings/page.tsx       ← Razorpay, email, WhatsApp
│   └── api/
│       ├── bookings/               ← Create + fetch bookings
│       ├── payment/                ← Razorpay order creation
│       └── admin/                  ← Admin APIs
├── components/
│   ├── ui/                         ← Navbar, Footer
│   ├── hotel/                      ← SearchBar, HotelGallery, RoomCard
│   ├── booking/                    ← BookingForm, ConfirmationClient
│   └── admin/                      ← AdminSidebar
├── lib/
│   ├── hotels-data.ts              ← All 9 hotel data
│   ├── supabase.ts                 ← Database client
│   ├── email.ts                    ← Email templates
│   ├── utils.ts                    ← Helpers, formatters
│   └── schema.sql                  ← Run this in Supabase
├── styles/globals.css              ← Brand colors + Tailwind
└── public/images/                  ← Upload hotel photos here
```

---

## 📸 Adding Hotel Photos

Upload photos to these folders (create them inside `public/images/`):
```
public/images/hotels/tirupati/      → hotel1.jpg, room1.jpg, room2.jpg
public/images/hotels/hyderabad/     → hotel1.jpg, room1.jpg
public/images/hotels/kakinada/      → hotel1.jpg, room1.jpg
public/images/hotels/nellore/       → hotel1.jpg, room1.jpg
public/images/hotels/vijayawada/    → hotel1.jpg, room1.jpg, room2.jpg
public/images/hotels/excotica/      → hotel1.jpg, room1.jpg, room2.jpg, room3.jpg
public/images/hotels/vintage/       → hotel1.jpg, room1.jpg, room2.jpg
public/images/hotels/cozy/          → hotel1.jpg, room1.jpg, room2.jpg
public/images/hotels/central/       → hotel1.jpg, room1.jpg
public/images/hero-video.mp4        → Your homepage hero video
```

---

## 🎨 Brand Colors
```
Gold:      #C9A84C
Gold Dark: #B8963E
Black:     #0A0A0A
Rich Black:#1A1209
White:     #FFFFFF
Cream:     #F9F5ED
```

---

## 📞 Support
Contact via WhatsApp: +91 96181 38686

---

*Built with Next.js 14, Supabase, Razorpay, Tailwind CSS, Resend*
