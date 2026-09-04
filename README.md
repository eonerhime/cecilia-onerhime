# Cecilia Onerhime Memorial

Add approved photographs to `public/images/` and the burial programme PDF to `public/programme/`.

## Database setup

Run `db/schema.sql` once in the Neon SQL Editor. Keep `DATABASE_URL`, `DIRECT_URL`, and `ADMIN_PASSWORD` in `.env` locally and add them to the Vercel project environment variables. The tribute form stores submissions as `pending`; visit `/admin` to review and approve or reject tribute and gallery submissions. Admin authentication is limited to five failed attempts per 15 minutes per IP, followed by a 30-minute lockout. Public tribute submissions are limited to four accepted submissions per hour per IP.

Visitor image uploads additionally need a Vercel Blob store and `BLOB_READ_WRITE_TOKEN`. The media table is ready for approved image and YouTube/Vimeo URL records.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:1944](http://localhost:1944) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
