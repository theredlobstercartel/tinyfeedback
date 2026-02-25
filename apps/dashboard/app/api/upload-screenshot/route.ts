/**
 * API Route for Screenshot Upload
 * ST-13: Formulário de Sugestões e Bugs
 * 
 * Handles screenshot uploads for feedback submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Max file size: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const ticketId = formData.get('ticketId') as string

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID é obrigatório' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 2MB.' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG ou PNG.' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${ticketId}.${fileExt}`
    const filePath = `feedback-screenshots/${fileName}`

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('feedback-screenshots')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('feedback-screenshots')
      .getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    })
  } catch (error) {
    console.error('Screenshot upload error:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar upload' },
      { status: 500 }
    )
  }
}
