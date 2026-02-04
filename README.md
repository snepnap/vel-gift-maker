# Valentine Platform

Premium Valentine's Day webpage builder.

## Local Development

```bash
npm install
npm run dev
```

## Deployment to Render.com

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. New → Web Service → Connect your repo
4. Add environment variable: `STRIPE_SECRET_KEY`
5. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `NODE_ENV` | Set to `production` |

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/create-checkout-session` - Create Stripe payment
- `GET /api/verify-payment/:sessionId` - Verify payment
