import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define which routes are public
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/clerk',
])

const isPendingRoute = createRouteMatcher(['/pending-approval(.*)'])
const isDashboardRoute = createRouteMatcher(['/dashboard'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isSalesmanRoute = createRouteMatcher(['/salesman(.*)'])

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth()

    // 1. If it's a public route, let it pass
    if (isPublicRoute(req)) {
        return NextResponse.next()
    }

    // 2. If not authenticated, the user will be redirected to sign-in by Clerk automatically
    if (!userId) {
        await auth.protect()
        return NextResponse.next()
    }

    // 3. Role-based access control
    // We expect the role to be in sessionClaims.metadata.role (synced from Supabase via webhook)
    const role = (sessionClaims?.metadata as { role?: string })?.role || 'pending'
    const isApproved = (sessionClaims?.metadata as { is_approved?: boolean })?.is_approved || false

    // If user is not approved and not on the pending page or dashboard dispatcher, redirect them
    if (!isApproved && !isPendingRoute(req) && !isDashboardRoute(req)) {
        return NextResponse.redirect(new URL('/pending-approval', req.url))
    }

    // If user is approved but trying to access a route they don't have permission for
    // If user is approved but trying to access a route they don't have permission for
    if (isApproved) {
        if (isAdminRoute(req) && role !== 'admin') {
            return NextResponse.redirect(new URL('/', req.url))
        }
        if (isSalesmanRoute(req) && role !== 'salesman' && role !== 'admin') {
            return NextResponse.redirect(new URL('/', req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
