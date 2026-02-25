import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Validation schema for signup
const signupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'A senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
});

export type SignupRequest = z.infer<typeof signupSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = signupSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ');
      return NextResponse.json(
        { error: errors },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase client
    const supabase = await createClient();

    // Attempt to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);
      
      // Handle specific error cases
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        return NextResponse.json(
          { error: 'Este email já está em uso. Tente fazer login.' },
          { status: 409 }
        );
      }
      
      if (error.message.includes('weak')) {
        return NextResponse.json(
          { error: 'A senha é muito fraca. Use uma senha mais forte.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Erro ao criar conta' },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // Return success with user info
    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message: 'Conta criada com sucesso! Verifique seu email para confirmar.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
