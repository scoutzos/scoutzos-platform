import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const { deal_id, buy_box_id, match_score } = await request.json();

        if (!deal_id || !buy_box_id) {
            return NextResponse.json({ error: 'Missing deal_id or buy_box_id' }, { status: 400 });
        }

        // Fetch deal details
        const { data: deal, error: dealError } = await supabaseAdmin
            .from('deals')
            .select('*')
            .eq('id', deal_id)
            .single();

        if (dealError || !deal) {
            return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
        }

        // Fetch buy box with investor details
        const { data: buyBox, error: buyBoxError } = await supabaseAdmin
            .from('buy_boxes')
            .select('*, investor:investors(*)')
            .eq('id', buy_box_id)
            .single();

        if (buyBoxError || !buyBox) {
            return NextResponse.json({ error: 'Buy box not found' }, { status: 404 });
        }

        // Get investor email
        const investorEmail = buyBox.investor?.email || 'unknown@example.com';
        const investorName = buyBox.investor?.name || 'Investor';

        // For now, just console.log the email instead of actually sending
        const emailContent = {
            to: investorEmail,
            subject: `New Deal Match: ${deal.address_line1}`,
            body: `
Hello ${investorName},

Great news! A new property matches your "${buyBox.name}" buy box criteria with a ${match_score}% match score.

PROPERTY DETAILS:
-----------------
Address: ${deal.address_line1}
         ${deal.city}, ${deal.state} ${deal.zip}

Price: $${deal.list_price?.toLocaleString()}
Beds/Baths: ${deal.beds || '-'} / ${deal.baths || '-'}
Square Feet: ${deal.sqft?.toLocaleString() || 'N/A'}
Est. Rent: $${deal.estimated_rent?.toLocaleString() || 'N/A'}/month

Match Score: ${match_score}%

View this deal: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/deals/${deal.id}

Best regards,
ScoutzOS Team
            `.trim(),
        };

        console.log(`[EMAIL ALERT] Sending match notification email:`);
        console.log(`  To: ${emailContent.to}`);
        console.log(`  Subject: ${emailContent.subject}`);
        console.log(`  Deal ID: ${deal_id}`);
        console.log(`  Buy Box: ${buyBox.name} (${buy_box_id})`);
        console.log(`  Match Score: ${match_score}%`);

        // In production, you would integrate with an email service here:
        // await sendEmail(emailContent);

        return NextResponse.json({
            success: true,
            message: 'Email alert logged (console)',
            email: emailContent,
        });
    } catch (error: unknown) {
        console.error('Send match email error:', error);
        return NextResponse.json({ error: 'Failed to send email alert' }, { status: 500 });
    }
}
