import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getClientIP, checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// CORS headers for widget requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
};

// File upload limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * POST /api/widget/upload
 * Upload attachment files to Supabase Storage
 * Requires X-API-Key header for project authentication
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Handle preflight CORS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }

    // Check rate limit
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429, 
          headers: { ...corsHeaders, ...rateLimitHeaders }
        }
      );
    }

    // Get API key from header
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key is required' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;
    const type = (formData.get('type') as string | null) || 'upload';

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify API key matches project
    const { data: project, error: projectError } = await supabase
      .from('bmad_projects')
      .select('id, api_key, allowed_domains, storage_used_mb, storage_limit_mb, plan, subscription_status')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (project.api_key !== apiKey) {
      return NextResponse.json(
        { error: 'Invalid API Key' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Check storage limits for free plan
    const isPro = project.plan === 'pro' && project.subscription_status === 'active';
    const storageLimit = isPro ? (project.storage_limit_mb || 1024) : 100; // 100MB for free
    const currentStorage = project.storage_used_mb || 0;
    const fileSizeMB = file.size / (1024 * 1024);

    if (currentStorage + fileSizeMB > storageLimit) {
      return NextResponse.json(
        { 
          error: 'STORAGE_LIMIT_REACHED',
          message: 'Storage limit reached. Please upgrade your plan or delete old attachments.',
          current_usage: currentStorage,
          limit: storageLimit
        },
        { status: 429, headers: corsHeaders }
      );
    }

    // Validate domain if allowed_domains is set
    if (project.allowed_domains?.length > 0) {
      const origin = request.headers.get('origin') || '';
      const referer = request.headers.get('referer') || '';
      const requestUrl = origin || referer;
      
      const isAllowed = project.allowed_domains.some((domain: string) => {
        if (!requestUrl) return false;
        try {
          const url = new URL(requestUrl);
          return url.hostname === domain || url.hostname.endsWith(`.${domain}`);
        } catch {
          return requestUrl.includes(domain);
        }
      });

      if (!isAllowed) {
        return NextResponse.json(
          { error: 'Domain not authorized' },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${projectId}/${type}/${timestamp}-${randomId}.${fileExt}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('feedback-attachments')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('feedback-attachments')
      .getPublicUrl(fileName);

    // Update project storage usage
    const newStorageUsage = currentStorage + fileSizeMB;
    await supabase
      .from('bmad_projects')
      .update({ storage_used_mb: newStorageUsage })
      .eq('id', projectId);

    return NextResponse.json(
      { 
        success: true, 
        url: publicUrlData.publicUrl,
        path: fileName,
        size: file.size
      },
      { status: 201, headers: { ...corsHeaders, ...rateLimitHeaders } }
    );

  } catch (error) {
    console.error('Error in POST /api/widget/upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { 
    status: 204,
    headers: corsHeaders 
  });
}
