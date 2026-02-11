import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, createClerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
    console.log('🚀 CLERK WEBHOOK RECEIVED');

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error('❌ Missing svix headers');
        return new Response('Error occured -- no svix headers', {
            status: 400
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const signingSecret = process.env.CLERK_WEBHOOK_SECRET || process.env.SIGNING_SECRET || "";
    if (!signingSecret) {
        console.error('❌ NO SIGNING SECRET CONFIGURED');
    }
    const wh = new Webhook(signingSecret);

    let evt: WebhookEvent;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error('❌ Webhook verification failed:', err);
        return new Response('Error occured', {
            status: 400
        });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`✅ Webhook verified: ID=${id}, type=${eventType}`);

    const clerkClient = await createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;

        const email = email_addresses[0]?.email_address;
        const full_name = `${first_name || ''} ${last_name || ''}`.trim();

        // Extract role and approval status from metadata
        const role = (public_metadata as { role?: string })?.role || 'pending';
        const is_approved = (public_metadata as { is_approved?: boolean })?.is_approved ?? false;
        const branch_id = (public_metadata as { branch_id?: string })?.branch_id || null;

        console.log(`👤 Processing user: ${email} (${id})`);
        console.log(`📊 Metadata: role=${role}, is_approved=${is_approved}, branch_id=${branch_id}`);

        if (!id || !email) {
            console.error('❌ Missing user ID or email in webhook data');
            return new Response('Error occured -- missing user data', {
                status: 400
            });
        }

        // 1. Update Supabase
        console.log('💾 Upserting to Supabase...');
        const { data: user, error: supabaseError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: id,
                email: email,
                full_name: full_name,
                role: role,
                is_approved: is_approved,
                branch_id: branch_id
            }, { onConflict: 'id' })
            .select()
            .single();

        if (supabaseError) {
            console.error('❌ Supabase Upsert Error:', supabaseError);
            return new Response(`Error updating database: ${supabaseError.message}`, {
                status: 500
            });
        }

        console.log('✨ Supabase sync successful:', user);

        // 2. Sync to Clerk Metadata
        try {
            console.log('🔄 Syncing metadata to Clerk...');
            await clerkClient.users.updateUserMetadata(id, {
                publicMetadata: {
                    role: user.role,
                    is_approved: user.is_approved,
                    branch_id: user.branch_id
                }
            });
            console.log('✅ Clerk metadata updated');
        } catch (clerkError) {
            console.error('⚠️ Clerk metadata update failed (but Supabase is done):', clerkError);
        }
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data;
        console.log(`🗑️ Deleting user: ${id}`);

        if (!id) {
            return new Response('Error occured -- missing user ID', {
                status: 400
            });
        }

        const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('❌ Supabase Delete Error:', error);
            return new Response('Error updating database', {
                status: 500
            });
        }
        console.log('✅ User deleted from Supabase');
    }

    return new Response('Success', { status: 200 });
}
